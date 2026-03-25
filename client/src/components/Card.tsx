import React, { useState } from 'react';
import {
  Play, ExternalLink,
  AlertTriangle, Trash2, GitMerge, RotateCcw
} from 'lucide-react';
import { Task } from '../../../shared/types';
import { useBoardStore } from '../store/useBoardStore';
import clsx from 'clsx';

const TAG_COLORS: Record<string, string> = {
  frontend: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  backend: 'bg-green-500/20 text-green-400 border-green-500/30',
  bug: 'bg-red-500/20 text-red-400 border-red-500/30',
  feature: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  refactor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  docs: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  test: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  perf: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const STATUS_BORDER_COLORS: Record<string, string> = {
  todo: 'border-l-dark-500',
  solving: 'border-l-accent-purple',
  done: 'border-l-accent-green',
};

interface Props {
  task: Task;
  isActive: boolean;
}


export function Card({ task, isActive }: Props) {
  const { runTask, removeTask, agentRunning } = useBoardStore();
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const isThinking = isActive && task.column === 'solving';

  const handleRun = async () => {
    try {
      await runTask(task.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (agentRunning && isActive) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await removeTask(task.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className={clsx(
      'card border-l-[3px] space-y-3 transition-all duration-300 group',
      STATUS_BORDER_COLORS[task.column] || 'border-l-dark-500',
      isThinking && 'card-active',
      task.error && 'card-error',
      deleting && 'opacity-50'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
          {task.description && (
            <p className="text-xs text-dark-400 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
          <p className="text-xs text-dark-500 mt-0.5 font-mono">#{task.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-1">
          {task.column === 'todo' && !agentRunning && (
            <button
              onClick={handleRun}
              className="p-1.5 rounded-lg bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 transition-colors opacity-30 group-hover:opacity-100"
              title="Run with AI"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting || (agentRunning && isActive)}
                className="px-2 py-1 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors"
              >
                Sure?
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 rounded-lg text-xs text-dark-400 hover:text-white bg-dark-600 transition-colors"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={handleDelete}
              disabled={deleting || (agentRunning && isActive)}
              className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map(tag => (
            <span
              key={tag}
              className={clsx('tag-chip border', TAG_COLORS[tag] || 'bg-dark-600 text-dark-300 border-dark-500')}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Thinking animation — animated gradient border sweep */}
      {isThinking && (
        <div className="relative h-1 rounded-full overflow-hidden bg-dark-600">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-purple via-accent-blue to-accent-purple bg-[length:200%_100%] animate-shimmer rounded-full" />
        </div>
      )}

      {/* Progress bar */}
      {task.progress > 0 && (
        <div
          className="relative group/progress"
          onMouseEnter={() => setShowProgress(true)}
          onMouseLeave={() => setShowProgress(false)}
        >
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${task.progress}%` }} />
          </div>
          {showProgress && (
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-dark-600 text-dark-200 px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
              {task.progress}%
            </span>
          )}
        </div>
      )}

      {/* PR Badge */}
      {task.prNumber && task.prUrl && (
        <a
          href={task.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg px-2.5 py-1.5 hover:bg-green-500/25 transition-colors w-fit"
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span className="font-medium">View PR #{task.prNumber}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {/* Error */}
      {task.error && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-red-300">{task.error}</span>
          </div>
          {task.column === 'todo' && !agentRunning && (
            <button
              onClick={handleRun}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
