import { create } from 'zustand';
import { Task, ColumnId } from '../../../shared/types';
import { tasksApi } from '../api';

interface BoardState {
  tasks: Task[];
  agentRunning: boolean;
  agentTaskId: string | null;
  isLoading: boolean;
  error: string | null;

  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  setAgentRunning: (running: boolean, taskId?: string) => void;

  fetchTasks: (projectId?: string) => Promise<void>;
  createTask: (data: { title: string; description?: string; tags?: string[]; projectId?: string }) => Promise<void>;
  moveTask: (id: string, column: ColumnId) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  runTask: (id: string) => Promise<void>;

  getTasksByColumn: (column: ColumnId) => Task[];
}

export const useBoardStore = create<BoardState>((set, get) => ({
  tasks: [],
  agentRunning: false,
  agentTaskId: null,
  isLoading: false,
  error: null,

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set(state => ({ tasks: [...state.tasks, task] })),
  updateTask: (task) => set(state => ({
    tasks: state.tasks.map(t => t.id === task.id ? task : t),
  })),
  deleteTask: (id) => set(state => ({
    tasks: state.tasks.filter(t => t.id !== id),
  })),
  setAgentRunning: (running, taskId) => set({ agentRunning: running, agentTaskId: taskId || null }),

  fetchTasks: async (projectId?: string) => {
    set({ isLoading: true });
    try {
      const tasks = await tasksApi.getAll(projectId);
      set({ tasks, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createTask: async (data) => {
    await tasksApi.create(data);
  },

  moveTask: async (id, column) => {
    const task = await tasksApi.move(id, column);
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? task : t),
    }));
  },

  removeTask: async (id) => {
    await tasksApi.delete(id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  runTask: async (id) => {
    await tasksApi.run(id);
  },

  getTasksByColumn: (column) => get().tasks.filter(t => t.column === column),
}));
