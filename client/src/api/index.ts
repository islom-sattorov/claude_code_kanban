import axios from 'axios';
import { Task, Project } from '../../../shared/types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const tasksApi = {
  getAll: (projectId?: string) =>
    api.get<Task[]>('/tasks', { params: projectId ? { projectId } : {} }).then(r => r.data),
  create: (data: { title: string; description?: string; tags?: string[]; projectId?: string }) =>
    api.post<Task>('/tasks', data).then(r => r.data),
  update: (id: string, data: Partial<Task>) =>
    api.patch<Task>(`/tasks/${id}`, data).then(r => r.data),
  move: (id: string, column: string) =>
    api.patch<Task>(`/tasks/${id}/move`, { column }).then(r => r.data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  run: (id: string) => api.post(`/tasks/${id}/run`).then(r => r.data),
};

export interface GitHubRepo {
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  private: boolean;
  stars: number;
  language: string | null;
  updatedAt: string;
  cloneUrl: string;
  htmlUrl: string;
}

export const projectsApi = {
  getAll: () => api.get<Project[]>('/projects').then(r => r.data),
  create: (data: { name: string; repoUrl: string; branch?: string }) =>
    api.post<Project>('/projects', data).then(r => r.data),
  pull: (id: string) => api.post<Project>(`/projects/${id}/pull`).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  searchRepos: (user: string) =>
    api.get<GitHubRepo[]>('/projects/search', { params: { user } }).then(r => r.data),
};

export const configApi = {
  get: () => api.get<{ hasPat: boolean }>('/config').then(r => r.data),
  update: (data: { githubPat?: string }) => api.put('/config', data).then(r => r.data),
};
