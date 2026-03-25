import React from 'react';
import {
  ClipboardList, Brain, CheckCircle2, Inbox
} from 'lucide-react';
import { ColumnId } from '../../../shared/types';
import { useBoardStore } from '../store/useBoardStore';
import { Card } from './Card';
import clsx from 'clsx';

const COLUMN_META: Record<ColumnId, {
  label: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  emptyIcon: React.ReactNode;
  emptyText: string;
}> = {
  todo: {
    label: 'TODO',
    icon: <ClipboardList className="w-4 h-4" />,
    accentColor: 'bg-dark-500',
    badgeBg: 'bg-dark-600',
    badgeText: 'text-dark-400',
    emptyIcon: <Inbox className="w-8 h-8 text-dark-500" />,
    emptyText: 'Add tasks to get started',
  },
  solving: {
    label: 'Solving',
    icon: <Brain className="w-4 h-4" />,
    accentColor: 'bg-accent-purple',
    badgeBg: 'bg-accent-purple/15',
    badgeText: 'text-accent-purple',
    emptyIcon: <Brain className="w-8 h-8 text-dark-500" />,
    emptyText: 'AI is working on it',
  },
  done: {
    label: 'Done',
    icon: <CheckCircle2 className="w-4 h-4" />,
    accentColor: 'bg-accent-green',
    badgeBg: 'bg-accent-green/15',
    badgeText: 'text-accent-green',
    emptyIcon: <CheckCircle2 className="w-8 h-8 text-dark-500" />,
    emptyText: 'Completed tasks',
  },
};

const COLUMN_GLOW: Record<ColumnId, string> = {
  todo: '',
  solving: 'border-accent-purple/40',
  done: 'border-accent-green/40',
};

interface Props {
  columnId: ColumnId;
  isActive: boolean;
}

export function Column({ columnId, isActive }: Props) {
  const { getTasksByColumn, agentTaskId, agentRunning } = useBoardStore();
  const tasks = getTasksByColumn(columnId);
  const meta = COLUMN_META[columnId];

  return (
    <div className={clsx(
      'flex flex-col min-w-[280px] max-w-[280px] bg-dark-800 rounded-2xl border transition-all duration-300 overflow-hidden',
      isActive ? `${COLUMN_GLOW[columnId]} shadow-lg column-active` : 'border-dark-600',
      'h-full'
    )}>
      {/* Top accent bar */}
      <div className={clsx('h-[2px] w-full', meta.accentColor)} />

      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-dark-600">
        <div className="flex items-center gap-2">
          <span className={meta.badgeText}>{meta.icon}</span>
          <span className={clsx('text-sm font-semibold', meta.badgeText)}>{meta.label}</span>
        </div>
        <span className={clsx(
          'text-xs font-bold px-2 py-0.5 rounded-full',
          isActive ? `${meta.badgeBg} ${meta.badgeText}` : 'bg-dark-600 text-dark-400'
        )}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {tasks.length === 0 ? (
          <div className={clsx(
            'flex flex-col items-center justify-center gap-2 h-32 rounded-xl border border-dashed transition-all',
            !agentRunning
              ? 'border-dark-500 animate-pulse'
              : 'border-dark-600'
          )}>
            {meta.emptyIcon}
            <span className="text-xs text-dark-500 text-center px-4">{meta.emptyText}</span>
          </div>
        ) : (
          tasks.map(task => (
            <Card
              key={task.id}
              task={task}
              isActive={task.id === agentTaskId || (task.column !== 'todo' && task.column !== 'done')}
            />
          ))
        )}
      </div>
    </div>
  );
}
