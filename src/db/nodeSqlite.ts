import { DatabaseSync } from 'node:sqlite';
import type { SqlExecutor, SqlParam } from './types';

export function createNodeSqliteExecutor(db: DatabaseSync): SqlExecutor {
  return {
    async exec(sql: string) {
      db.exec(sql);
    },
    async run(sql: string, params: SqlParam[] = []) {
      db.prepare(sql).run(...params);
    },
    async all<T>(sql: string, params: SqlParam[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async get<T>(sql: string, params: SqlParam[] = []) {
      const row = db.prepare(sql).get(...params) as T | undefined;
      return row ?? null;
    },
  };
}
