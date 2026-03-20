import React, { useState } from 'react';
import { X, Plus, Tag } from 'lucide-react';
import { useBoardStore } from '../store/useBoardStore';
import clsx from 'clsx';

const TAG_OPTIONS = ['frontend', 'backend', 'bug', 'feature', 'refactor', 'docs', 'test', 'perf'];
const TAG_COLORS: Record<string, string> = {
  frontend: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  backend: 'bg-green-500/20 text-green-400 border-green-500/30',
  bug: 'bg-red-500/20 text-red-400 border-red-500/30',
  feature: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  refactor: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  docs: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  test: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  perf: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

interface Props {
  onClose: () => void;
}

export function AddTaskModal({ onClose }: Props) {
  const { createTask } = useBoardStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      await createTask({ title: title.trim(), description: description.trim() || undefined, tags: selectedTags });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-600">
          <h2 className="text-lg font-semibold text-white">New Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-dark-300 hover:text-white hover:bg-dark-700 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-dark-300 uppercase tracking-wider">Task Title *</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Add dark mode toggle to settings page"
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-purple transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-dark-300 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional context for the AI agent..."
              rows={3}
              className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-dark-400 focus:outline-none focus:border-accent-purple transition-colors resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={clsx(
                    'tag-chip border transition-all',
                    selectedTags.includes(tag)
                      ? TAG_COLORS[tag] || 'bg-accent-purple/20 text-accent-purple border-accent-purple/30'
                      : 'bg-dark-700 text-dark-400 border-dark-500 hover:border-dark-400'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-dark-500 text-dark-300 hover:text-white hover:border-dark-400 transition-all text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-accent-purple text-white font-medium text-sm hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
