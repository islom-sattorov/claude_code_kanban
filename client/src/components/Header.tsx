import React, { useState, useEffect } from 'react';
import { Settings, Zap, Loader2, X, GitBranch, CheckCircle, AlertCircle } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import { configApi } from '../api';
import clsx from 'clsx';

interface ConfigState {
  repoOwner:  string;
  repoName:   string;
  baseBranch: string;
  githubPat:  string;
  hasPat:     boolean;
  repoCloned: boolean;
}

export function Header() {
  const { agentRunning } = useBoardStore();
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ConfigState>({
    repoOwner:  '',
    repoName:   '',
    baseBranch: 'main',
    githubPat:  '',
    hasPat:     false,
    repoCloned: false,
  });
  const [saving, setSaving]   = useState(false);
  const [cloning, setCloning] = useState(false);
  const [cloneMsg, setCloneMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    configApi.get().then(setConfig).catch(console.error);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update(config);
      setShowConfig(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleClone = async () => {
    setCloning(true);
    setCloneMsg(null);
    try {
      await configApi.clone();
      setCloneMsg({ ok: true, text: 'Repository cloned successfully' });
      setConfig(c => ({ ...c, repoCloned: true }));
    } catch (err) {
      setCloneMsg({ ok: false, text: (err as Error).message });
    } finally {
      setCloning(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-dark-600 bg-dark-800">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">test</h1>
          <p className="text-xs text-dark-300">Autonomous Task Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Repo clone status */}
        {config.repoOwner && (
          <div className={clsx(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
            config.repoCloned
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
          )}>
            <GitBranch className="w-3.5 h-3.5" />
            <span>{config.repoOwner}/{config.repoName}</span>
            {config.repoCloned
              ? <CheckCircle className="w-3 h-3" />
              : <AlertCircle className="w-3 h-3" />}
          </div>
        )}

        {/* Agent Status */}
        <div className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border',
          agentRunning
            ? 'bg-accent-purple/10 border-accent-purple/40 text-accent-purple'
            : 'bg-dark-700 border-dark-500 text-dark-300'
        )}>
          {agentRunning ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Working</span></>
          ) : (
            <><div className="w-2 h-2 rounded-full bg-dark-400" /><span>Idle</span></>
          )}
        </div>

        {/* Config button */}
        <button
          onClick={() => setShowConfig(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-700 border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400 transition-all text-sm"
        >
          <Settings className="w-4 h-4" />
          <span>Configure</span>
        </button>
      </div>

      {/* Config Modal */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-dark-600">
              <h2 className="text-lg font-semibold">Configuration</h2>
              <button
                onClick={() => setShowConfig(false)}
                className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-dark-300 uppercase tracking-wider">GitHub PAT</label>
                <input
                  type="password"
                  value={config.githubPat}
                  onChange={e => setConfig(c => ({ ...c, githubPat: e.target.value }))}
                  placeholder={config.hasPat ? '••••••••••••••••' : 'ghp_xxxxxxxxxxxx'}
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-purple transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-dark-300 uppercase tracking-wider">Repo Owner</label>
                  <input
                    type="text"
                    value={config.repoOwner}
                    onChange={e => setConfig(c => ({ ...c, repoOwner: e.target.value }))}
                    placeholder="username"
                    className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-purple transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-dark-300 uppercase tracking-wider">Repo Name</label>
                  <input
                    type="text"
                    value={config.repoName}
                    onChange={e => setConfig(c => ({ ...c, repoName: e.target.value }))}
                    placeholder="my-app"
                    className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-purple transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-dark-300 uppercase tracking-wider">Base Branch</label>
                <input
                  type="text"
                  value={config.baseBranch}
                  onChange={e => setConfig(c => ({ ...c, baseBranch: e.target.value }))}
                  placeholder="main"
                  className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-purple transition-colors"
                />
              </div>

              {/* Clone status message */}
              {cloneMsg && (
                <div className={clsx(
                  'flex items-center gap-2 text-xs rounded-lg px-3 py-2 border',
                  cloneMsg.ok
                    ? 'bg-green-500/10 border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                )}>
                  {cloneMsg.ok
                    ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    : <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                  <span>{cloneMsg.text}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 pt-0 flex-wrap">
              <button
                onClick={() => setShowConfig(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400 transition-all text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleClone}
                disabled={cloning || !config.repoOwner || !config.repoName}
                className="flex-1 px-4 py-2 rounded-lg bg-dark-600 border border-dark-500 text-white text-sm hover:border-accent-blue transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {cloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                {cloning ? 'Cloning…' : config.repoCloned ? 'Re-clone' : 'Clone Repo'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-accent-purple text-white font-medium text-sm hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
