import * as SQLite from 'expo-sqlite';
import { createExpoSqliteExecutor } from './expoSqlite';
import { createNotesRepository, type NotesRepository } from './notesRepository';

let opening: Promise<NotesRepository> | null = null;

export function getNotesRepository(): Promise<NotesRepository> {
  if (!opening) {
    opening = openRepository().catch((error: unknown) => {
      opening = null;
      throw error;
    });
  }
  return opening;
}

async function openRepository(): Promise<NotesRepository> {
  const db = await SQLite.openDatabaseAsync('whispervault.db');
  const repository = createNotesRepository(createExpoSqliteExecutor(db));
  await repository.migrate();
  return repository;
}
