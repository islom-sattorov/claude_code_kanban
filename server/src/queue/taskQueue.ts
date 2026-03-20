import PQueue from 'p-queue';

const concurrency = Number(process.env.AGENT_CONCURRENCY) || 1;

export const taskQueue = new PQueue({ concurrency });

export function enqueueTask<T>(fn: () => Promise<T>): Promise<T> {
  return taskQueue.add(fn) as Promise<T>;
}
