import React, { useEffect } from 'react';
import { Header } from './components/Header';
import { KanbanBoard } from './components/KanbanBoard';
import { LogPanel } from './components/LogPanel';
import { useSSE } from './hooks/useSSE';
import { useBoardStore } from './store/useBoardStore';

export default function App() {
  useSSE();
  const { fetchTasks } = useBoardStore();

  useEffect(() => {
    fetchTasks();
  }, []);

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
