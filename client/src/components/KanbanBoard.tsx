import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { ColumnId } from '../../../shared/types';
import { useBoardStore } from '../store/useBoardStore';
import { useProjectStore } from '../store/useProjectStore';
import { Column } from './Column';
import { AddTaskModal } from './AddTaskModal';
import clsx from 'clsx';

const COLUMNS: ColumnId[] = ['todo', 'in_progress', 'solving', 'qa', 'done'];

export function KanbanBoard() {
  const { agentTaskId, tasks, fetchTasks, isLoading } = useBoardStore();
  const { projects, activeProjectId, setActiveProject, getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();
  const [showAddModal, setShowAddModal] = useState(false);

  const getActiveColumn = (): ColumnId | null => {
    if (!agentTaskId) return null;
    const task = tasks.find(t => t.id === agentTaskId);
    return task?.column || null;
  };

  const activeColumn = getActiveColumn();

  const handleProjectFilter = (projectId: string | null) => {
    setActiveProject(projectId);
  };

  // Keyboard shortcut: N for new task
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      e.key === 'n' &&
      !e.metaKey && !e.ctrlKey && !e.altKey &&
      !(e.target instanceof HTMLInputElement) &&
      !(e.target instanceof HTMLTextAreaElement) &&
      !(e.target instanceof HTMLSelectElement)
    ) {
      setShowAddModal(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col flex-1 min-h-0 p-6 gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {activeProject ? activeProject.name : 'Task Board'}
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">{tasks.length} task{tasks.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group/refresh">
            <button
              onClick={() => fetchTasks(activeProjectId ?? undefined)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-700 border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400 transition-all text-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-[10px] font-medium bg-dark-600 text-dark-200 rounded shadow-lg whitespace-nowrap opacity-0 group-hover/refresh:opacity-100 transition-opacity pointer-events-none">
              Refresh board
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
            <kbd className="ml-1 text-[10px] font-mono opacity-60 bg-white/10 px-1.5 py-0.5 rounded">N</kbd>
          </button>
        </div>
      </div>

      {/* Project filter strip */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => handleProjectFilter(null)}
            className={clsx(
              'px-3 py-1 rounded-pill text-xs font-medium transition-all whitespace-nowrap border',
              activeProjectId === null
                ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple'
                : 'bg-dark-700 border-dark-600 text-dark-400 hover:text-white hover:border-dark-400'
            )}
          >
            All
          </button>
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => handleProjectFilter(project.id)}
              className={clsx(
                'px-3 py-1 rounded-pill text-xs font-medium transition-all whitespace-nowrap border',
                activeProjectId === project.id
                  ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple'
                  : 'bg-dark-700 border-dark-600 text-dark-400 hover:text-white hover:border-dark-400'
              )}
            >
              {project.name}
            </button>
          ))}
        </div>
      )}

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
