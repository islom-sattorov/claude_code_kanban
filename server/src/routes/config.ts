import { Router, Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { pool } from '../store/db';
dotenv.config();

let githubPat: string = process.env.GITHUB_PAT || '';

/** Load persisted PAT from DB (called once at startup after initDb). */
export async function loadConfig(): Promise<void> {
  const { rows } = await pool.query("SELECT value FROM config WHERE key = 'githubPat'");
  if (rows[0]) githubPat = rows[0].value;
}

async function persistPat(): Promise<void> {
  await pool.query(
    `INSERT INTO config (key, value) VALUES ('githubPat', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [githubPat]
  );
}

export function getConfig() {
  return { githubPat };
}

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ hasPat: !!githubPat });
});

router.put('/', async (req: Request, res: Response) => {
  const { githubPat: newPat } = req.body;
  // Only update if a non-empty value was provided
  if (newPat && newPat.trim()) {
    githubPat = newPat.trim();
    await persistPat();
  }
  res.json({ success: true });
});

export default router;
