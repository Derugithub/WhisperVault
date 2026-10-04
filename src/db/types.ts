export type Note = {
  id: string;
  createdAt: number;
  transcript: string;
  audioUri: string | null;
};

export type SqlParam = string | number | null;

export interface SqlExecutor {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlParam[]): Promise<void>;
  all<T>(sql: string, params?: SqlParam[]): Promise<T[]>;
  get<T>(sql: string, params?: SqlParam[]): Promise<T | null>;
}

export type NoteRow = {
  id: string;
  createdAt: number;
  transcript: string;
  audioUri: string | null;
};
