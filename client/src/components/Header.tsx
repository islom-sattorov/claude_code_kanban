import React, { useState, useEffect } from 'react';
import { Settings, Zap, Loader2, X, CheckCircle, FolderGit2, KeyRound } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import { useProjectStore } from '../store/useProjectStore';
import { configApi } from '../api';
import { ProjectsPanel } from './ProjectsPanel';
import clsx from 'clsx';

export function Header() {
  const { agentRunning } = useBoardStore();
  const { getActiveProject } = useProjectStore();
  const activeProject = getActiveProject();

  const [showConfig, setShowConfig] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [hasPat, setHasPat] = useState(false);
  const [pat, setPat] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    configApi.get().then((data: { hasPat: boolean }) => setHasPat(data.hasPat)).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update({ githubPat: pat });
      if (pat.trim()) setHasPat(true);
      setPat('');
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowConfig(false); }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className={clsx(
      'flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-dark-800 to-dark-900 transition-all duration-500',
      agentRunning
        ? 'border-accent-purple/30 shadow-[0_1px_12px_0_rgba(139,92,246,0.15)]'
        : 'border-dark-600'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className={clsx(
          'relative w-9 h-9 rounded-xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center transition-shadow duration-500',
          agentRunning && 'shadow-glow-purple'
        )}>
          {agentRunning && (
            <div className="absolute inset-0 rounded-xl border-2 border-accent-purple/50 animate-ping" />
          )}
          <Zap className="w-4 h-4 text-white relative z-10" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">AI Kanban</h1>
          <p className="text-xs text-dark-300">Autonomous Task Engine</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Agent status */}
        <div className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
          agentRunning
            ? 'bg-accent-purple/10 border-accent-purple/40 text-accent-purple'
            : 'bg-dark-700 border-dark-500 text-dark-300'
        )}>
          {agentRunning
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Working</span></>
            : <><div className="w-2 h-2 rounded-full bg-dark-400" /><span>Idle</span></>}
        </div>

        {/* Active project badge — opens Projects panel */}
        {activeProject && (
          <button
            onClick={() => setShowProjects(true)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border bg-accent-purple/10 border-accent-purple/30 text-accent-purple hover:bg-accent-purple/20 transition-colors"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>{activeProject.name}</span>
          </button>
        )}

        {/* PAT status badge */}
        <div className={clsx(
          'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
          hasPat
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
        )}>
          <KeyRound className="w-3 h-3" />
          <span>{hasPat ? 'PAT set' : 'No PAT'}</span>
          {hasPat && <CheckCircle className="w-3 h-3" />}
        </div>

        {/* Projects button */}
        <button
          onClick={() => setShowProjects(true)}
          className="btn-ghost flex items-center gap-2 px-3 py-1.5 text-sm"
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Projects</span>
        </button>

        {/* Configure button */}
        <button
          onClick={() => setShowConfig(true)}
          className="btn-ghost flex items-center gap-2 px-3 py-1.5 text-sm"
        >
          <Settings className="w-4 h-4" />
          <span>Configure</span>
        </button>
      </div>

      {/* Configure modal — PAT only */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="panel-header flex items-center justify-between p-6 border-b border-dark-600">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-accent-purple" />
                <h2 className="text-base font-semibold text-white">GitHub Token</h2>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-dark-400">
                Used to clone private repositories and create pull requests. Needs <code className="text-accent-purple bg-dark-700 px-1 rounded">repo</code> scope.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-dark-300 uppercase tracking-wider">
                  Personal Access Token
                </label>
                <input
                  autoFocus
                  type="password"
                  value={pat}
                  onChange={e => setPat(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSave()}
                  placeholder={hasPat ? '••••••••  (leave blank to keep current)' : 'ghp_xxxxxxxxxxxx'}
                  className="input-field w-full"
                />
              </div>
              {saved && (
                <div className="flex items-center gap-2 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Token saved successfully
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-0">
              <button onClick={() => setShowConfig(false)} className="btn-ghost flex-1 px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || (!pat.trim() && !hasPat)}
                className="btn-primary flex-1 px-4 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Save Token
              </button>
            </div>
          </div>
        </div>
      )}

      <ProjectsPanel isOpen={showProjects} onClose={() => setShowProjects(false)} />
    </header>
  );
}
