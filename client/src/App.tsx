import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { LogPanel } from './components/LogPanel';
import { useSSE } from './hooks/useSSE';
import { useBoardStore } from './store/useBoardStore';
import { useProjectStore } from './store/useProjectStore';
import { useLogStore } from './store/useLogStore';

export default function App() {
  useSSE();
  const { fetchTasks, tasks } = useBoardStore();
  const { fetchProjects, activeProjectId } = useProjectStore();
  const { addEntry } = useLogStore();

  useEffect(() => {
    addEntry({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), level: 'info', message: 'App initialized' });
    fetchProjects();
    fetchTasks();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      addEntry({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), level: 'success', message: `Loaded ${tasks.length} task${tasks.length !== 1 ? 's' : ''}` });
    }
  }, [tasks.length]);

  useEffect(() => {
    fetchTasks(activeProjectId ?? undefined);
  }, [activeProjectId]);

  return (
    <div className="flex flex-col h-screen bg-dark-900 overflow-hidden">
      <Header />
      <div className="flex flex-col flex-1 min-h-0">
        <KanbanBoard />
        <LogPanel />
      </div>
    </div>
  );
}
