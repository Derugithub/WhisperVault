import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { createExpoSqliteExecutor } from './expoSqlite';
import { createNotesRepository, type NotesRepository } from './notesRepository';

let opening: Promise<NotesRepository> | null = null;
let database: SQLite.SQLiteDatabase | null = null;

export function getNotesRepository(): Promise<NotesRepository> {
  if (!opening) {
    opening = openRepository().catch((error: unknown) => {
      opening = null;
      throw error;
    });
  }
  return opening;
}

function closeDatabase(): void {
  const current = database;
  database = null;
  if (!current) {
    return;
  }
  try {
    current.closeSync();
  } catch {
    // The next open creates a fresh connection.
  }
}

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    opening = null;
    closeDatabase();
  });
}

async function openRepository(): Promise<NotesRepository> {
  const journalMode = Platform.OS === 'web' ? 'DELETE' : 'WAL';
  const attempts = Platform.OS === 'web' ? 3 : 1;
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const db = await SQLite.openDatabaseAsync('whispervault.db');
      database = db;
      const repository = createNotesRepository(createExpoSqliteExecutor(db));
      await repository.migrate(journalMode);
      return repository;
    } catch (error) {
      lastError = error;
      closeDatabase();
      if (attempt + 1 < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 200 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}
