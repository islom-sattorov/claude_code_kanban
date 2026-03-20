import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      tags        TEXT[]       NOT NULL DEFAULT '{}',
      column_name TEXT         NOT NULL DEFAULT 'todo',
      progress    INTEGER      NOT NULL DEFAULT 0,
      qa_items    JSONB        NOT NULL DEFAULT '[]',
      pr_number   INTEGER,
      pr_url      TEXT,
      error       TEXT,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}
