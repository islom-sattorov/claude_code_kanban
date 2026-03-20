import React, { useRef, useEffect, useState } from 'react';
import { Terminal, Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useLogStore } from '../store/useLogStore';
import { LogEntry } from '../../../shared/types';
import clsx from 'clsx';

const LEVEL_STYLES: Record<string, string> = {
  info: 'text-dark-300',
  success: 'text-green-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

const LEVEL_LABELS: Record<string, string> = {
  info: 'INFO',
  success: 'DONE',
  warn: 'WARN',
  error: 'ERR ',
};

function LogRow({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });
  return (
    <div className={clsx('flex items-start gap-3 py-1 font-mono text-xs group', LEVEL_STYLES[entry.level])}>
      <span className="text-dark-500 flex-shrink-0 pt-0.5">{time}</span>
      <span className={clsx(
        'flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold leading-none',
        entry.level === 'success' ? 'bg-green-500/10 text-green-400' :
        entry.level === 'warn' ? 'bg-yellow-500/10 text-yellow-400' :
        entry.level === 'error' ? 'bg-red-500/10 text-red-400' :
        'bg-dark-600 text-dark-400'
      )}>
        {LEVEL_LABELS[entry.level]}
      </span>
      <span className="flex-1 break-all">{entry.message}</span>
    </div>
  );
}

export function LogPanel() {
  const { entries, clear, export: exportLog } = useLogStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const handleExport = () => {
    const text = exportLog();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-kanban-log-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={clsx(
      'border-t border-dark-600 bg-dark-900 transition-all duration-300',
      collapsed ? 'h-12' : 'h-64'
    )}>
      {/* Log header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-dark-400" />
          <span className="text-sm font-medium text-dark-300">Activity Log</span>
          {entries.length > 0 && (
            <span className="text-xs bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full">
              {entries.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-dark-400 hover:text-white hover:bg-dark-700 transition-colors disabled:opacity-30"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={clear}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log entries */}
      {!collapsed && (
        <div className="h-[calc(100%-3rem)] overflow-y-auto px-4 py-2">
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-dark-500 italic">
              No activity yet. Start the agent to see logs here.
            </div>
          ) : (
            <>
              {entries.map(entry => (
                <LogRow key={entry.id} entry={entry} />
              ))}
              <div ref={bottomRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
