import axios from 'axios';
import { Task, Config } from '../../../shared/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const tasksApi = {
  getAll: () => api.get<Task[]>('/tasks').then(r => r.data),
  create: (data: { title: string; description?: string; tags?: string[] }) =>
    api.post<Task>('/tasks', data).then(r => r.data),
  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, data).then(r => r.data),
  move: (id: string, column: string) =>
    api.patch<Task>(`/tasks/${id}/move`, { column }).then(r => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  run: (id: string) => api.post(`/tasks/${id}/run`).then(r => r.data),
};

export const configApi = {
  get: () => api.get('/config').then(r => r.data),
  update: (data: Partial<Config> & { githubPat?: string }) =>
    api.put('/config', data).then(r => r.data),
  clone: () => api.post('/config/clone').then(r => r.data),
};
