import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { ColumnId } from '../../../shared/types';
import { useBoardStore } from '../store/useBoardStore';
import { Column } from './Column';
import { AddTaskModal } from './AddTaskModal';

const COLUMNS: ColumnId[] = ['todo', 'in_progress', 'solving', 'qa', 'done'];

export function KanbanBoard() {
  const { agentTaskId, tasks, fetchTasks, isLoading } = useBoardStore();
  const [showAddModal, setShowAddModal] = useState(false);

  const getActiveColumn = (): ColumnId | null => {
    if (!agentTaskId) return null;
    const task = tasks.find(t => t.id === agentTaskId);
    return task?.column || null;
  };

  const activeColumn = getActiveColumn();

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Task Board</h2>
          <p className="text-xs text-dark-400 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTasks}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400 transition-all text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-purple text-white font-medium text-sm hover:bg-purple-500 transition-colors shadow-lg shadow-accent-purple/20"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1 min-h-0">
        {COLUMNS.map(columnId => (
          <Column
            key={columnId}
            columnId={columnId}
            isActive={activeColumn === columnId}
          />
        ))}
      </div>

      {showAddModal && <AddTaskModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
