import { Task } from '../../../shared/types';
import { taskStore } from '../store/taskStore';
import { sseEmitter } from '../sse/sseEmitter';
import { enqueueTask } from '../queue/taskQueue';
import { solveTask } from './TaskSolver';
import { runQA } from './QARunner';
import { describePR } from './PRDescriber';
import { createBranch, createPR } from '../services/githubService';
import { getConfig } from '../routes/config';
import { v4 as uuidv4 } from 'uuid';

let agentRunning = false;

function log(level: 'info' | 'success' | 'warn' | 'error', message: string) {
  sseEmitter.broadcast({
    type: 'log:entry',
    payload: {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
    },
  });
}

async function updateTask(task: Task, updates: Partial<Task>): Promise<Task> {
  const updated = (await taskStore.update(task.id, updates))!;
  sseEmitter.broadcast({ type: 'task:updated', payload: updated });
  return updated;
}

export async function processTask(taskId: string): Promise<void> {
  return enqueueTask(async () => {
    const task = await taskStore.getById(taskId);
    if (!task) {
      log('error', `Task ${taskId} not found`);
      return;
    }

    agentRunning = true;
    sseEmitter.broadcast({ type: 'agent:start', payload: { taskId } });

    let currentTask = task;

    try {
      // 1. Move to in_progress
      currentTask = await updateTask(currentTask, { column: 'in_progress', progress: 5 });
      log('info', `[${currentTask.title}] Agent picked up task`);

      // 2. Move to solving
      currentTask = await updateTask(currentTask, { column: 'solving', progress: 20 });
      log('info', `[${currentTask.title}] Calling Claude Code to solve task...`);

      const solution = await solveTask(currentTask);
      log('success', `[${currentTask.title}] Solution generated: ${solution.filesChanged.join(', ')}`);
      log('info', `[${currentTask.title}] Commit message: ${solution.commitMessage}`);

      currentTask = await updateTask(currentTask, { progress: 50 });

      // 3. Move to QA
      currentTask = await updateTask(currentTask, { column: 'qa', progress: 50 });
      log('info', `[${currentTask.title}] Starting QA checks...`);

      const qaItems = await runQA(currentTask, solution.filesChanged);
      currentTask = await updateTask(currentTask, {
        qaItems: qaItems.map(item => ({ ...item })),
        progress: 80,
      });

      qaItems.forEach(item => {
        log(
          item.status === 'pass' ? 'success' : 'error',
          `[${currentTask.title}] QA: ${item.label} — ${item.status}${item.detail ? ` (${item.detail})` : ''}`
        );
      });

      const failedItems = qaItems.filter(item => item.status === 'fail');
      if (failedItems.length > 0) {
        log('warn', `[${currentTask.title}] ${failedItems.length} QA item(s) failed. Attempting remediation...`);
        // One retry attempt
        const retryQA = await runQA(currentTask, solution.filesChanged);
        const stillFailing = retryQA.filter(i => i.status === 'fail');
        currentTask = await updateTask(currentTask, { qaItems: retryQA });
        if (stillFailing.length > 0) {
          log('error', `[${currentTask.title}] QA still failing after retry: ${stillFailing.map(i => i.label).join(', ')}`);
          currentTask = await updateTask(currentTask, {
            column: 'todo',
            progress: 0,
            error: `QA failed: ${stillFailing.map(i => i.label).join(', ')}`,
          });
          sseEmitter.broadcast({ type: 'agent:stop', payload: { taskId, status: 'qa_failed' } });
          agentRunning = false;
          return;
        }
      }

      // 4. Create PR
      log('info', `[${currentTask.title}] Generating PR description...`);
      const prDesc = await describePR(currentTask, solution.filesChanged, solution.rationale, qaItems);

      log('info', `[${currentTask.title}] Creating GitHub branch and PR...`);
      const branchName = `ai-kanban/${currentTask.id.slice(0, 8)}-${currentTask.title.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 40)}`;

      try {
        await createBranch(branchName);
        const pr = await createPR(branchName, prDesc.title, prDesc.body);

        currentTask = await updateTask(currentTask, {
          column: 'done',
          progress: 100,
          prNumber: pr.number,
          prUrl: pr.html_url,
          error: undefined,
        });

        log('success', `[${currentTask.title}] PR #${pr.number} created: ${pr.html_url}`);
      } catch (prErr) {
        log('warn', `[${currentTask.title}] PR creation failed (GitHub not configured): ${(prErr as Error).message}`);
        // Move to done anyway since code is done
        currentTask = await updateTask(currentTask, {
          column: 'done',
          progress: 100,
          error: undefined,
        });
        log('success', `[${currentTask.title}] Task completed (PR skipped)`);
      }

      sseEmitter.broadcast({ type: 'agent:stop', payload: { taskId, status: 'done' } });
    } catch (err) {
      const message = (err as Error).message;
      log('error', `[${currentTask.title}] Agent error: ${message}`);
      await updateTask(currentTask, {
        column: 'todo',
        progress: 0,
        error: message,
      });
      sseEmitter.broadcast({ type: 'agent:error', payload: { taskId, error: message } });
    } finally {
      agentRunning = false;
    }
  });
}

export function isAgentRunning(): boolean {
  return agentRunning;
}
