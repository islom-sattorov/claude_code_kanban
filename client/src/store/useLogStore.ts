import { create } from 'zustand';
import { LogEntry } from '../../../shared/types';

interface LogState {
  entries: LogEntry[];
  addEntry: (entry: LogEntry) => void;
  clear: () => void;
  export: () => string;
}

export const useLogStore = create<LogState>((set, get) => ({
  entries: [],

  addEntry: (entry) => set(state => ({
    entries: [...state.entries.slice(-499), entry], // Keep last 500
  })),

  clear: () => set({ entries: [] }),

  export: () => {
    const entries = get().entries;
    return entries
      .map(e => `[${e.timestamp}] [${e.level.toUpperCase()}] ${e.message}`)
      .join('\n');
  },
}));
