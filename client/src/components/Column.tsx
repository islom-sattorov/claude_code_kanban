import React from 'react';
import { ColumnId } from '../../../shared/types';
import { useBoardStore } from '../store/useBoardStore';
import { Card } from './Card';
import clsx from 'clsx';

const COLUMN_META: Record<ColumnId, { label: string; icon: string; color: string; glowColor: string }> = {
  todo: { label: 'TODO', icon: '\u{1F4CB}', color: 'text-dark-300', glowColor: '' },
  in_progress: { label: 'In Progress', icon: '\u{26A1}', color: 'text-accent-blue', glowColor: 'border-accent-blue/40' },
  solving: { label: 'Solving', icon: '\u{1F9E0}', color: 'text-accent-purple', glowColor: 'border-accent-purple/40' },
  qa: { label: 'QA', icon: '\u{1F50D}', color: 'text-accent-yellow', glowColor: 'border-accent-yellow/40' },
  done: { label: 'Done', icon: '\u{2705}', color: 'text-accent-green', glowColor: 'border-accent-green/40' },
};

interface Props {
  columnId: ColumnId;
  isActive: boolean;
}

export function Column({ columnId, isActive }: Props) {
  const { getTasksByColumn, agentTaskId } = useBoardStore();
  const tasks = getTasksByColumn(columnId);
  const meta = COLUMN_META[columnId];

  return (
    <div className={clsx(
      'flex flex-col min-w-[280px] max-w-[280px] bg-dark-800 rounded-2xl border transition-all duration-300',
      isActive ? `${meta.glowColor} shadow-lg column-active` : 'border-dark-600',
      'h-full'
    )}>
      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-dark-600">
        <div className="flex items-center gap-2">
          <span className="text-base">{meta.icon}</span>
          <span className={clsx('text-sm font-semibold', meta.color)}>{meta.label}</span>
        </div>
        <span className={clsx(
          'text-xs font-bold px-2 py-0.5 rounded-full',
          isActive ? 'bg-accent-purple/20 text-accent-purple' : 'bg-dark-600 text-dark-400'
        )}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {tasks.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-xs text-dark-500 italic">
            No tasks
          </div>
        ) : (
          tasks.map(task => (
            <Card
              key={task.id}
              task={task}
              isActive={task.id === agentTaskId}
            />
          ))
        )}
      </div>
    </div>
  );
}
