import React, { useState, useRef } from 'react';
import {
  FolderGit2,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  RefreshCw,
  GitBranch,
  FolderOpen,
  Search,
  Star,
  Lock,
  Globe,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { projectsApi, GitHubRepo } from '../api';
import clsx from 'clsx';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type FormStep = 'search' | 'results' | 'confirm';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function ProjectsPanel({ isOpen, onClose }: Props) {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    createProject,
    pullProject,
    deleteProject,
  } = useProjectStore();

  // Project list actions
  const [pullingId, setPullingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Add project flow
  const [showForm, setShowForm] = useState(false);
  const [step, setStep] = useState<FormStep>('search');

  // Search step
  const [searchUser, setSearchUser] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<GitHubRepo[]>([]);
  const [repoFilter, setRepoFilter] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Confirm/create step
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [name, setName] = useState('');
  const [branch, setBranch] = useState('main');
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setStep('search');
    setSearchUser('');
    setSearchResults([]);
    setRepoFilter('');
    setSearchError(null);
    setSelectedRepo(null);
    setName('');
    setBranch('main');
    setCreating(false);
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchUser.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      const repos = await projectsApi.searchRepos(searchUser.trim());
      setSearchResults(repos);
      setStep('results');
    } catch (err) {
      setSearchError((err as Error).message);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectRepo = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setName(repo.name);
    setBranch(repo.defaultBranch);
    setStep('confirm');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRepo || !name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createProject({
        name: name.trim(),
        repoUrl: selectedRepo.cloneUrl,
        branch: branch.trim() || undefined,
      });
      closeForm();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handlePull = async (id: string) => {
    setPullingId(id);
    setError(null);
    try {
      await pullProject(id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPullingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteProject(id);
      setConfirmDeleteId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredResults = searchResults.filter(r =>
    r.name.toLowerCase().includes(repoFilter.toLowerCase()) ||
    (r.description ?? '').toLowerCase().includes(repoFilter.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-md bg-dark-800 border-l border-dark-600 shadow-2xl flex flex-col h-full animate-slide-in-right">

        {/* Header */}
        <div className="panel-header flex items-center justify-between p-6 border-b border-dark-600">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-accent-purple" />
            <h2 className="text-lg font-semibold text-white">Projects</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global error banner */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-xs rounded-lg px-3 py-2 border bg-red-500/10 border-red-500/20 text-red-400">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X className="w-3 h-3" /></button>
          </div>
        )}

        {/* Project list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {/* "All Projects" option */}
          <button
            onClick={() => setActiveProject(null)}
            className={clsx(
              'w-full text-left px-4 py-3 rounded-xl border transition-all text-sm',
              activeProjectId === null
                ? 'bg-accent-purple/10 border-accent-purple/40 text-accent-purple'
                : 'bg-dark-700 border-dark-600 text-dark-300 hover:border-dark-400'
            )}
          >
            All Projects
          </button>

          {projects.map((project) => (
            <div
              key={project.id}
              className={clsx(
                'rounded-xl border p-4 transition-all',
                activeProjectId === project.id
                  ? 'bg-dark-700 border-accent-purple/40 border-l-[3px] border-l-accent-purple'
                  : 'bg-dark-700 border-dark-600'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-medium text-white truncate">{project.name}</h3>
                    {activeProjectId === project.id && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-purple/20 text-accent-purple border border-accent-purple/30 font-medium">
                        Active
                      </span>
                    )}
                    <span className={clsx(
                      'inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border',
                      project.cloned
                        ? 'bg-green-500/10 border-green-500/30 text-green-400'
                        : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                    )}>
                      {project.cloned ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                      {project.cloned ? 'Cloned' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400 mt-1 truncate">{project.repoUrl}</p>
                  <p className="text-xs text-dark-400 mt-0.5 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />{project.branch}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => setActiveProject(project.id)}
                  className={clsx(
                    'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                    activeProjectId === project.id
                      ? 'bg-accent-purple text-white'
                      : 'bg-dark-600 border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400'
                  )}
                >
                  {activeProjectId === project.id ? 'Active' : 'Select'}
                </button>

                <button
                  onClick={() => handlePull(project.id)}
                  disabled={pullingId === project.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-600 border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400 transition-all text-xs disabled:opacity-40"
                >
                  {pullingId === project.id
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <RefreshCw className="w-3 h-3" />}
                  Pull
                </button>

                {confirmDeleteId === project.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDelete(project.id)}
                      disabled={deletingId === project.id}
                      className="px-2 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all text-xs disabled:opacity-40"
                    >
                      {deletingId === project.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1.5 rounded-lg bg-dark-600 border border-dark-500 text-dark-300 hover:text-white transition-all text-xs"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(project.id)}
                    className="p-1.5 rounded-lg bg-dark-600 border border-dark-500 text-dark-300 hover:text-red-400 hover:border-red-500/30 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}

          {projects.length === 0 && !showForm && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-dark-700 border border-dark-600 flex items-center justify-center">
                <FolderOpen className="w-8 h-8 text-dark-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-dark-300">No projects yet</p>
                <p className="text-xs text-dark-500 max-w-[240px]">
                  Search a GitHub user and pick a repository to get started.
                </p>
              </div>
              <button onClick={openForm} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add your first project
              </button>
            </div>
          )}
        </div>

        {/* ── Add project footer ── */}
        <div className="border-t border-dark-600">

          {/* Form area — animated slide */}
          <div className={clsx(
            'overflow-hidden transition-all duration-300',
            showForm ? 'max-h-[520px]' : 'max-h-0'
          )}>
            {showForm && (
              <div className="p-5 space-y-4">

                {/* Step indicator */}
                <div className="flex items-center gap-2 text-xs text-dark-400">
                  {step !== 'search' && (
                    <button
                      onClick={() => setStep(step === 'confirm' ? 'results' : 'search')}
                      className="p-1 rounded hover:text-white hover:bg-dark-700 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className={clsx(step === 'search' ? 'text-white' : '')}>Search</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={clsx(step === 'results' ? 'text-white' : '')}>Pick repo</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className={clsx(step === 'confirm' ? 'text-white' : '')}>Confirm</span>
                </div>

                {/* ── Step 1: Search user ── */}
                {step === 'search' && (
                  <form onSubmit={handleSearch} className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-dark-300 uppercase tracking-wider block mb-1.5">
                        GitHub Username
                      </label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchUser}
                            onChange={e => setSearchUser(e.target.value)}
                            placeholder="e.g. torvalds"
                            className="input-field pl-9 w-full"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={!searchUser.trim() || searching}
                          className="btn-primary px-4 py-2 text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    {searchError && (
                      <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {searchError}
                      </div>
                    )}
                    <button type="button" onClick={closeForm} className="btn-ghost w-full py-2 text-sm">
                      Cancel
                    </button>
                  </form>
                )}

                {/* ── Step 2: Pick a repo ── */}
                {step === 'results' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-dark-400">
                        <span className="text-white font-medium">{searchResults.length}</span> repos for{' '}
                        <span className="text-accent-purple font-medium">{searchUser}</span>
                      </p>
                    </div>
                    {searchResults.length > 5 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
                        <input
                          type="text"
                          value={repoFilter}
                          onChange={e => setRepoFilter(e.target.value)}
                          placeholder="Filter repositories…"
                          className="input-field pl-9 w-full text-sm"
                        />
                      </div>
                    )}
                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                      {filteredResults.length === 0 && (
                        <p className="text-xs text-dark-400 text-center py-4">No repositories match "{repoFilter}"</p>
                      )}
                      {filteredResults.map(repo => (
                        <button
                          key={repo.fullName}
                          onClick={() => handleSelectRepo(repo)}
                          className="w-full text-left px-3 py-2.5 rounded-lg bg-dark-700 border border-dark-600 hover:border-accent-purple/50 hover:bg-dark-600 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                {repo.private
                                  ? <Lock className="w-3 h-3 text-dark-400 flex-shrink-0" />
                                  : <Globe className="w-3 h-3 text-dark-400 flex-shrink-0" />}
                                <span className="text-sm font-medium text-white truncate group-hover:text-accent-purple transition-colors">
                                  {repo.name}
                                </span>
                              </div>
                              {repo.description && (
                                <p className="text-xs text-dark-400 mt-0.5 truncate">{repo.description}</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 text-[10px] text-dark-500">
                              {repo.stars > 0 && (
                                <span className="flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5" />{repo.stars}
                                </span>
                              )}
                              {repo.language && <span>{repo.language}</span>}
                              <span>{timeAgo(repo.updatedAt)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Step 3: Confirm details ── */}
                {step === 'confirm' && selectedRepo && (
                  <form onSubmit={handleCreate} className="space-y-3">
                    {/* Selected repo preview */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-accent-purple/10 border border-accent-purple/30">
                      {selectedRepo.private
                        ? <Lock className="w-4 h-4 text-accent-purple flex-shrink-0" />
                        : <Globe className="w-4 h-4 text-accent-purple flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{selectedRepo.fullName}</p>
                        {selectedRepo.description && (
                          <p className="text-xs text-dark-400 truncate">{selectedRepo.description}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-dark-300 uppercase tracking-wider block mb-1.5">
                        Project Name
                      </label>
                      <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="input-field w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-dark-300 uppercase tracking-wider block mb-1.5">
                        Branch
                      </label>
                      <div className="relative">
                        <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dark-400" />
                        <input
                          type="text"
                          value={branch}
                          onChange={e => setBranch(e.target.value)}
                          className="input-field pl-9 w-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={closeForm} className="btn-ghost flex-1 py-2 text-sm">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!name.trim() || creating}
                        className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {creating
                          ? <><Loader2 className="w-4 h-4 animate-spin" />Cloning…</>
                          : <><Plus className="w-4 h-4" />Add Project</>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Add button (only when form is closed and there are existing projects) */}
          {!showForm && projects.length > 0 && (
            <div className="p-4">
              <button
                onClick={openForm}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-dark-700 border border-dark-500 text-dark-300 hover:text-white hover:border-accent-purple transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
