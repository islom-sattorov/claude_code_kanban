import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS config (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      repo_url    TEXT NOT NULL,
      local_path  TEXT NOT NULL,
      branch      TEXT NOT NULL DEFAULT 'main',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      description TEXT,
      tags        TEXT[]       NOT NULL DEFAULT '{}',
      column_name TEXT         NOT NULL DEFAULT 'todo',
      progress    INTEGER      NOT NULL DEFAULT 0,
      qa_items    JSONB        NOT NULL DEFAULT '[]',
      project_id  TEXT         REFERENCES projects(id) ON DELETE SET NULL,
      pr_number   INTEGER,
      pr_url      TEXT,
      error       TEXT,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  // Migration: add project_id column if it doesn't exist (for existing deployments)
  await pool.query(`
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE SET NULL
  `);
}
