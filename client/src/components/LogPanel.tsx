import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Terminal, Download, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useLogStore } from '../store/useLogStore';
import { useBoardStore } from '../store/useBoardStore';
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

const FILTER_LEVELS = [
  { key: 'info', label: 'INFO', color: 'bg-dark-600 text-dark-300', activeColor: 'bg-dark-500 text-white' },
  { key: 'success', label: 'DONE', color: 'bg-dark-600 text-dark-300', activeColor: 'bg-green-500/20 text-green-400' },
  { key: 'warn', label: 'WARN', color: 'bg-dark-600 text-dark-300', activeColor: 'bg-yellow-500/20 text-yellow-400' },
  { key: 'error', label: 'ERR', color: 'bg-dark-600 text-dark-300', activeColor: 'bg-red-500/20 text-red-400' },
];

function getRelativeTime(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function LogRow({ entry }: { entry: LogEntry }) {
  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour12: false });
  const [showRelative, setShowRelative] = useState(false);

  return (
    <div className={clsx(
      'flex items-start gap-3 py-1 font-mono text-xs group/row rounded px-1 -mx-1 transition-colors hover:bg-dark-700/50',
      LEVEL_STYLES[entry.level]
    )}>
      <span
        className="text-dark-500 flex-shrink-0 pt-0.5 cursor-default relative"
        onMouseEnter={() => setShowRelative(true)}
        onMouseLeave={() => setShowRelative(false)}
      >
        {time}
        {showRelative && (
          <span className="absolute left-0 -top-6 bg-dark-600 text-dark-200 px-1.5 py-0.5 rounded shadow-lg text-[10px] whitespace-nowrap z-10">
            {getRelativeTime(entry.timestamp)}
          </span>
        )}
      </span>
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

const MIN_HEIGHT = 48;
const DEFAULT_HEIGHT = 256;

export function LogPanel() {
  const { entries, clear, export: exportLog } = useLogStore();
  const { agentRunning } = useBoardStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const [isDragging, setIsDragging] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(['info', 'success', 'warn', 'error'])
  );

  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  const toggleFilter = (level: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        // Don't allow deselecting all
        if (next.size > 1) next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  const filteredEntries = entries.filter(e => activeFilters.has(e.level));

  // Drag-to-resize logic
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;
  }, [panelHeight]);

  useEffect(() => {
    if (!isDragging) return;

    const maxHeight = window.innerHeight * 0.4;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = dragStartY.current - e.clientY;
      const newHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, dragStartHeight.current + delta));
      setPanelHeight(newHeight);
      if (newHeight <= MIN_HEIGHT) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
    <div
      ref={panelRef}
      className="border-t border-dark-600 bg-dark-900 transition-[height] duration-150 flex flex-col relative"
      style={{ height: collapsed ? MIN_HEIGHT : panelHeight }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className={clsx(
          'absolute top-0 left-0 right-0 h-1 cursor-ns-resize z-10 transition-colors',
          isDragging ? 'bg-accent-purple/40' : 'hover:bg-dark-500'
        )}
      />

      {/* Log header */}
      <div className="flex items-center justify-between px-4 h-12 flex-shrink-0 border-b border-dark-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-dark-400" />
          <span className="text-sm font-medium text-dark-300">Activity Log</span>
          {entries.length > 0 && (
            <span className="text-xs bg-dark-700 text-dark-400 px-2 py-0.5 rounded-full">
              {entries.length}
            </span>
          )}
          {agentRunning && (
            <span className="flex items-center gap-1.5 text-xs text-accent-purple ml-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="animate-pulse">Agent thinking...</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {/* Filter pills */}
          {!collapsed && FILTER_LEVELS.map(f => (
            <button
              key={f.key}
              onClick={() => toggleFilter(f.key)}
              className={clsx(
                'px-2 py-0.5 rounded-full text-[10px] font-bold transition-all',
                activeFilters.has(f.key) ? f.activeColor : f.color,
                !activeFilters.has(f.key) && 'opacity-50'
              )}
            >
              {f.label}
            </button>
          ))}

          <div className="w-px h-4 bg-dark-600 mx-1" />

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
            onClick={() => {
              setCollapsed(!collapsed);
              if (collapsed) setPanelHeight(DEFAULT_HEIGHT);
            }}
            className="p-1.5 rounded text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Log entries */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
          {filteredEntries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-dark-500 italic">
              {entries.length === 0
                ? 'No activity yet. Start the agent to see logs here.'
                : 'No entries match the current filters.'}
            </div>
          ) : (
            <>
              {filteredEntries.map(entry => (
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
