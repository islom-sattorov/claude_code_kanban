import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import tasksRouter from './routes/tasks';
import configRouter from './routes/config';
import sseRouter from './routes/sse';
import { getConfig } from './routes/config';
import { initDb } from './store/db';
import { cloneOrPull, isRepoCloned } from './git/repoManager';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/config', configRouter);
app.use('/api/sse', sseRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start(): Promise<void> {
  // 1. Database
  await initDb();

  // 2. Clone / pull repo (skip if GitHub is not yet configured)
  const { repoOwner, repoName } = getConfig();
  if (repoOwner && repoName) {
    try {
      cloneOrPull();
    } catch (err) {
      console.warn(`Could not clone repo: ${(err as Error).message}`);
      console.warn('Set GITHUB_REPO_OWNER / GITHUB_REPO_NAME and use POST /api/config/clone to retry.');
    }
  } else {
    console.warn('No repo configured. Use the UI to set GitHub details then click "Clone Repo".');
  }

  // 3. Listen
  app.listen(PORT, () => {
    console.log(`AI Kanban server running on http://localhost:${PORT}`);
    if (isRepoCloned()) {
      console.log('Repository ready at /repo');
    }
  });
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
