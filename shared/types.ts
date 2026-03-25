export type ColumnId = 'todo' | 'solving' | 'done';

export interface Project {
  id: string;
  name: string;
  repoUrl: string;
  localPath: string;
  branch: string;
  cloned: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  column: ColumnId;
  progress: number; // 0-100
  projectId?: string;
  prNumber?: number;
  prUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Config {
  githubPat: string;
}

export type SSEEventType =
  | 'task:created'
  | 'task:updated'
  | 'task:moved'
  | 'task:deleted'
  | 'agent:start'
  | 'agent:stop'
  | 'agent:error'
  | 'log:entry'
  | 'project:cloned';

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
