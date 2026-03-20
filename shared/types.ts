export type ColumnId = 'todo' | 'in_progress' | 'solving' | 'qa' | 'done';

export interface QAItem {
  id: string;
  label: string;
  status: 'pending' | 'pass' | 'fail';
  detail?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  column: ColumnId;
  progress: number; // 0-100
  qaItems: QAItem[];
  prNumber?: number;
  prUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Config {
  githubPat: string;
  repoOwner: string;
  repoName: string;
  repoPath: string;
  baseBranch: string;
}

export type SSEEventType =
  | 'task:created'
  | 'task:updated'
  | 'task:moved'
  | 'task:deleted'
  | 'agent:start'
  | 'agent:stop'
  | 'agent:error'
  | 'log:entry';

export interface SSEEvent {
  type: SSEEventType;
  payload: unknown;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
}
