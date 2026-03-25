import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();

import tasksRouter from './routes/tasks';
import configRouter from './routes/config';
import sseRouter from './routes/sse';
import projectsRouter from './routes/projects';
import { loadConfig } from './routes/config';
import { initDb } from './store/db';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/tasks', tasksRouter);
app.use('/api/config', configRouter);
app.use('/api/sse', sseRouter);
app.use('/api/projects', projectsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start(): Promise<void> {
  // 1. Database + persisted config
  await initDb();
  await loadConfig();

  // 2. Listen
  app.listen(PORT, () => {
    console.log(`AI Kanban server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Startup failed:', err);
  process.exit(1);
});
