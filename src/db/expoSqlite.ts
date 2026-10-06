import type * as SQLite from 'expo-sqlite';
import type { SqlExecutor, SqlParam } from './types';

type SqliteDatabase = SQLite.SQLiteDatabase;

export function createExpoSqliteExecutor(db: SqliteDatabase): SqlExecutor {
  return {
    async exec(sql: string) {
      await db.execAsync(sql);
    },
    async run(sql: string, params: SqlParam[] = []) {
      await db.runAsync(sql, params);
    },
    async all<T>(sql: string, params: SqlParam[] = []) {
      return db.getAllAsync<T>(sql, params);
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      const row = await db.getFirstAsync<T>(sql, params);
      return row ?? null;
    },
  };
}
