import { useEffect, useRef } from 'react';
import { useBoardStore } from '../store/useBoardStore';
import { useLogStore } from '../store/useLogStore';
import { useProjectStore } from '../store/useProjectStore';
import { Task, LogEntry } from '../../../shared/types';

export function useSSE() {
  const { setTasks, addTask, updateTask, deleteTask, setAgentRunning } = useBoardStore();
  const { addEntry } = useLogStore();
  const { fetchProjects } = useProjectStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const connect = () => {
      const es = new EventSource('/api/sse');
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);

          switch (type) {
            case 'init':
              setTasks(payload.tasks || []);
              setAgentRunning(payload.agentRunning || false);
              break;
            case 'task:created':
              addTask(payload as Task);
              break;
            case 'task:updated':
            case 'task:moved':
              updateTask(payload as Task);
              break;
            case 'task:deleted':
              deleteTask((payload as { id: string }).id);
              break;
            case 'agent:start':
              setAgentRunning(true, (payload as { taskId: string }).taskId);
              break;
            case 'agent:stop':
            case 'agent:error':
              setAgentRunning(false);
              break;
            case 'log:entry':
              addEntry(payload as LogEntry);
              break;
            case 'project:cloned':
              fetchProjects();
              break;
          }
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };

      es.onerror = () => {
        es.close();
        // Reconnect after 3s
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);
}
