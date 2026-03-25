import { create } from 'zustand';
import { Project } from '../../../shared/types';
import { projectsApi } from '../api';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (project: Project) => void;
  removeProject: (id: string) => void;
  setActiveProject: (id: string | null) => void;

  fetchProjects: () => Promise<void>;
  createProject: (data: { name: string; repoUrl: string; branch?: string }) => Promise<Project>;
  pullProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  getActiveProject: () => Project | null;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,

  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (project) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === project.id ? project : p)),
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    })),
  setActiveProject: (id) => set({ activeProjectId: id }),

  fetchProjects: async () => {
    try {
      const projects = await projectsApi.getAll();
      set({ projects });
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  },

  createProject: async (data) => {
    const project = await projectsApi.create(data);
    set((state) => ({ projects: [...state.projects, project] }));
    return project;
  },

  pullProject: async (id) => {
    const project = await projectsApi.pull(id);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? project : p)),
    }));
  },

  deleteProject: async (id) => {
    await projectsApi.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
    }));
  },

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    if (!activeProjectId) return null;
    return projects.find((p) => p.id === activeProjectId) ?? null;
  },
}));
