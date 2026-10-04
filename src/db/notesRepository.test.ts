import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { after, before, describe, it } from 'node:test';
import { createNotesRepository } from './notesRepository.ts';
import { createNodeSqliteExecutor } from './nodeSqlite.ts';
import type { Note } from './types.ts';

const directory = mkdtempSync(join(tmpdir(), 'whispervault-'));
const databasePath = join(directory, 'journal.db');

function openRepository(path: string) {
  const db = new DatabaseSync(path);
  const repository = createNotesRepository(createNodeSqliteExecutor(db));
  return { db, repository };
}

describe('notes repository', () => {
  let db: DatabaseSync;
  let repository: ReturnType<typeof createNotesRepository>;

  before(async () => {
    const opened = openRepository(databasePath);
    db = opened.db;
    repository = opened.repository;
    await repository.migrate();
  });

  after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });

  const garden: Note = {
    id: 'note-garden',
    createdAt: 1_700_000_000_000,
    transcript: 'Morning pages about the garden gate.',
    audioUri: 'file:///recordings/note-garden.wav',
  };

  const kitchen: Note = {
    id: 'note-kitchen',
    createdAt: 1_700_000_100_000,
    transcript: 'Remember to buy coffee and oranges.',
    audioUri: null,
  };

  it('saves a note and reads it back after the connection closes', async () => {
    await repository.saveNote(garden);
    await repository.saveNote(kitchen);
    db.close();

    const reopened = openRepository(databasePath);
    db = reopened.db;
    repository = reopened.repository;
    await repository.migrate();

    const saved = await repository.getNote(garden.id);
    assert.deepEqual(saved, garden);

    const listed = await repository.listNotes('');
    assert.deepEqual(
      listed.map((note) => note.id),
      [kitchen.id, garden.id],
    );
  });

  it('finds words inside transcripts and ignores other notes', async () => {
    const matches = await repository.listNotes('Garden');
    assert.deepEqual(
      matches.map((note) => note.id),
      [garden.id],
    );
    assert.equal((await repository.listNotes('oranges'))[0]?.id, kitchen.id);
    assert.deepEqual(await repository.listNotes('violin'), []);
  });

  it('treats like wildcards as plain text', async () => {
    await repository.saveNote({
      id: 'note-literal',
      createdAt: 1_700_000_200_000,
      transcript: '100% sure about item_a',
      audioUri: null,
    });
    assert.equal((await repository.listNotes('%'))[0]?.id, 'note-literal');
    assert.equal((await repository.listNotes('item_a'))[0]?.id, 'note-literal');
    assert.equal((await repository.listNotes('itemXa')).length, 0);
  });

  it('rejects an empty transcript', async () => {
    await assert.rejects(
      repository.saveNote({
        id: 'note-empty',
        createdAt: 1_700_000_300_000,
        transcript: '   ',
        audioUri: null,
      }),
      /transcript/,
    );
  });

  it('stores the recognition language and deletes notes', async () => {
    await repository.setSetting('recognitionLang', 'fr-FR');
    assert.equal(await repository.getSetting('recognitionLang'), 'fr-FR');
    await repository.setSetting('recognitionLang', 'de-DE');
    assert.equal(await repository.getSetting('recognitionLang'), 'de-DE');

    await repository.deleteNote(kitchen.id);
    assert.equal(await repository.getNote(kitchen.id), null);

    const removed = await repository.deleteAllNotes();
    assert.ok(removed.length >= 2);
    assert.deepEqual(await repository.listNotes(''), []);
  });
});
