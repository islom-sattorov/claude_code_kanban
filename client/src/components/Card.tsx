import React, { useState } from 'react';
import {
  Play, ExternalLink, CheckCircle, XCircle, Clock,
  AlertTriangle, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Task, QAItem } from '../../../shared/types';
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

interface Props {
  task: Task;
  isActive: boolean;
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="thinking-dot" />
      <span className="thinking-dot" />
      <span className="thinking-dot" />
    </div>
  );
}

function QAItemRow({ item }: { item: QAItem }) {
  return (
    <div className={clsx(
      'flex items-start gap-2 text-xs py-1',
      item.status === 'fail' ? 'text-red-400' : item.status === 'pass' ? 'text-green-400' : 'text-dark-300'
    )}>
      {item.status === 'pass' ? (
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      ) : item.status === 'fail' ? (
        <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      ) : (
        <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      )}
      <span>{item.label}</span>
      {item.detail && <span className="text-dark-400 ml-1">-- {item.detail}</span>}
    </div>
  );
}

export function Card({ task, isActive }: Props) {
  const { runTask, removeTask, agentRunning } = useBoardStore();
  const [showQA, setShowQA] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isThinking = isActive && (task.column === 'solving' || task.column === 'qa');
  const hasQA = task.qaItems.length > 0;
  const failedQA = task.qaItems.filter(i => i.status === 'fail').length;

  const handleRun = async () => {
    try {
      await runTask(task.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (agentRunning && isActive) return;
    setDeleting(true);
    try {
      await removeTask(task.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className={clsx(
      'bg-dark-700 border rounded-xl p-4 space-y-3 transition-all duration-300 group',
      isActive ? 'border-accent-purple/60 shadow-lg shadow-accent-purple/10' : 'border-dark-500',
      task.error ? 'border-red-500/40' : '',
      deleting ? 'opacity-50' : ''
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
          <p className="text-xs text-dark-400 mt-0.5 font-mono">#{task.id.slice(0, 8)}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {task.column === 'todo' && !agentRunning && (
            <button
              onClick={handleRun}
              className="p-1.5 rounded-lg bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30 transition-colors"
              title="Run with AI"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting || (agentRunning && isActive)}
            className="p-1.5 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
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

      {/* Thinking animation */}
      {isThinking && <ThinkingDots />}

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${task.progress}%` }} />
        </div>
      )}

      {/* QA Checklist */}
      {hasQA && (
        <div>
          <button
            onClick={() => setShowQA(!showQA)}
            className="flex items-center gap-1.5 text-xs text-dark-400 hover:text-white transition-colors w-full"
          >
            {failedQA > 0 ? (
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            )}
            <span className={failedQA > 0 ? 'text-yellow-400' : 'text-green-400'}>
              QA: {task.qaItems.filter(i => i.status === 'pass').length}/{task.qaItems.length} passed
            </span>
            {showQA ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>

          {showQA && (
            <div className="mt-2 pl-1 border-l border-dark-500 space-y-0.5">
              {task.qaItems.map(item => (
                <QAItemRow key={item.id} item={item} />
              ))}
            </div>
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
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="font-medium">PR #{task.prNumber}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      )}

      {/* Error */}
      {task.error && (
        <div className="flex items-start gap-2 text-xs bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-300">{task.error}</span>
        </div>
      )}
    </div>
  );
}
