import { Router, Request, Response } from 'express';
import { sseEmitter } from '../sse/sseEmitter';
import { taskStore } from '../store/taskStore';
import { isAgentRunning } from '../agent/AgentLoop';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  sseEmitter.addClient(res);

  // Send initial state
  const tasks = await taskStore.getAll();
  res.write(`data: ${JSON.stringify({ type: 'init', payload: { tasks, agentRunning: isAgentRunning() } })}\n\n`);
});

export default router;
