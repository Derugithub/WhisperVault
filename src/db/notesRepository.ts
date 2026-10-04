import type { Note, NoteRow, SqlExecutor } from './types';

const SCHEMA = `
PRAGMA busy_timeout = 3000;
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  created_at INTEGER NOT NULL,
  transcript TEXT NOT NULL,
  audio_uri TEXT
);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes (created_at DESC);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;

const NOTE_COLUMNS = `id, created_at AS createdAt, transcript, audio_uri AS audioUri`;

function mapNote(row: NoteRow): Note {
  return {
    id: String(row.id),
    createdAt: Number(row.createdAt),
    transcript: String(row.transcript),
    audioUri: row.audioUri == null ? null : String(row.audioUri),
  };
}

export function likePattern(query: string): string {
  const escaped = query.replace(/[!%_]/g, (character) => `!${character}`);
  return `%${escaped}%`;
}

export function createNotesRepository(db: SqlExecutor) {
  return {
    async migrate(journalMode: 'WAL' | 'DELETE' = 'WAL'): Promise<void> {
      await db.exec(`PRAGMA journal_mode = ${journalMode};\n${SCHEMA}`);
    },

    async saveNote(note: Note): Promise<void> {
      const transcript = note.transcript.trim();
      if (!transcript) {
        throw new Error('A note needs a transcript before it can be saved.');
      }
      await db.run(
        `INSERT INTO notes (id, created_at, transcript, audio_uri) VALUES (?, ?, ?, ?)`,
        [note.id, note.createdAt, transcript, note.audioUri],
      );
    },

    async listNotes(query: string): Promise<Note[]> {
      const normalized = query.trim().toLowerCase();
      const rows = normalized
        ? await db.all<NoteRow>(
            `SELECT ${NOTE_COLUMNS} FROM notes WHERE lower(transcript) LIKE ? ESCAPE '!' ORDER BY created_at DESC`,
            [likePattern(normalized)],
          )
        : await db.all<NoteRow>(`SELECT ${NOTE_COLUMNS} FROM notes ORDER BY created_at DESC`);
      return rows.map(mapNote);
    },

    async getNote(id: string): Promise<Note | null> {
      const row = await db.get<NoteRow>(`SELECT ${NOTE_COLUMNS} FROM notes WHERE id = ?`, [id]);
      return row ? mapNote(row) : null;
    },

    async deleteNote(id: string): Promise<void> {
      await db.run(`DELETE FROM notes WHERE id = ?`, [id]);
    },

    async deleteAllNotes(): Promise<Note[]> {
      const notes = await this.listNotes('');
      await db.run(`DELETE FROM notes`);
      return notes;
    },

    async getSetting(key: string): Promise<string | null> {
      const row = await db.get<{ value: string }>(`SELECT value FROM settings WHERE key = ?`, [key]);
      return row ? String(row.value) : null;
    },

    async setSetting(key: string, value: string): Promise<void> {
      await db.run(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, value],
      );
    },
  };
}

export type NotesRepository = ReturnType<typeof createNotesRepository>;
