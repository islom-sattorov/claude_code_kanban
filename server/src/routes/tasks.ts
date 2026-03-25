import { Router, Request, Response } from 'express';
import { taskStore } from '../store/taskStore';
import { sseEmitter } from '../sse/sseEmitter';
import { processTask } from '../agent/AgentLoop';
import { ColumnId } from '../../../shared/types';

interface IdParam { id: string }

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const projectId = req.query.projectId as string | undefined;
  const tasks = await taskStore.getAll(projectId);
  res.json(tasks);
});

router.post('/', async (req: Request, res: Response) => {
  const { title, description, tags, projectId } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  const task = await taskStore.create({ title, description, tags: tags || [], projectId });
  sseEmitter.broadcast({ type: 'task:created', payload: task });
  res.status(201).json(task);
});

router.patch('/:id', async (req: Request<IdParam>, res: Response) => {
  const task = await taskStore.update(req.params.id, req.body);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  sseEmitter.broadcast({ type: 'task:updated', payload: task });
  res.json(task);
});

router.patch('/:id/move', async (req: Request<IdParam>, res: Response) => {
  const { column } = req.body as { column: ColumnId };
  const task = await taskStore.move(req.params.id, column);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  sseEmitter.broadcast({ type: 'task:moved', payload: task });
  res.json(task);
});

router.delete('/:id', async (req: Request<IdParam>, res: Response) => {
  const deleted = await taskStore.delete(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  sseEmitter.broadcast({ type: 'task:deleted', payload: { id: req.params.id } });
  res.status(204).send();
});

router.post('/:id/run', async (req: Request<IdParam>, res: Response) => {
  const task = await taskStore.getById(req.params.id);
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  if (task.column !== 'todo') {
    res.status(400).json({ error: 'Task must be in TODO column to run' });
    return;
  }
  processTask(req.params.id).catch(console.error);
  res.json({ message: 'Agent started', taskId: req.params.id });
});

export default router;
