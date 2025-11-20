import React, { useEffect, useState } from 'react';
import { getTrashedTasks, restoreTask, permanentlyDeleteTask, purgeOldTasks, purgeCompletedTasks } from '../../services/api';
import { Task } from '../../types';

interface TrashTask extends Task {
  deletedAt?: string;
}

const TrashboxPage: React.FC = () => {
  const [tasks, setTasks] = useState<TrashTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgingCompleted, setPurgingCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    console.log('[TrashboxPage] Loading trashed tasks...');
    setLoading(true);
    setError(null);
    try {
      const data = await getTrashedTasks();
      console.log('[TrashboxPage] Loaded trashed tasks:', data.length);
      setTasks(data as TrashTask[]);
    } catch (e:any) {
      console.error('[TrashboxPage] Error loading trashed tasks:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRestore = async (id: string) => {
    console.log('[TrashboxPage] Restoring task:', id);
    try {
      await restoreTask(id);
      console.log('[TrashboxPage] Task restored successfully:', id);
      await load();
    } catch (e:any) {
      console.error('[TrashboxPage] Error restoring task:', e.message);
      setError(e.message);
    }
  };

  const onPermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this task? This cannot be undone.')) {
      console.log('[TrashboxPage] Permanent delete cancelled by user');
      return;
    }
    console.log('[TrashboxPage] Permanently deleting task:', id);
    try {
      await permanentlyDeleteTask(id);
      console.log('[TrashboxPage] Task permanently deleted:', id);
      await load();
    } catch (e:any) {
      console.error('[TrashboxPage] Error permanently deleting task:', e.message);
      setError(e.message);
    }
  };

  const onPurge = async () => {
    if (!confirm('Purge all tasks older than 30 days?')) {
      console.log('[TrashboxPage] Purge cancelled by user');
      return;
    }
    console.log('[TrashboxPage] Starting purge of old tasks...');
    setPurging(true);
    try {
      await purgeOldTasks();
      console.log('[TrashboxPage] Purge completed successfully');
      await load();
    } catch (e:any) {
      console.error('[TrashboxPage] Error purging old tasks:', e.message);
      setError(e.message);
    } finally {
      setPurging(false);
    }
  };

  const onPurgeCompleted = async () => {
    if (!confirm('Permanently delete all completed tasks older than 30 days? This cannot be undone.')) {
      console.log('[TrashboxPage] Completed task purge cancelled by user');
      return;
    }
    console.log('[TrashboxPage] Starting purge of old completed tasks...');
    setPurgingCompleted(true);
    try {
      const result = await purgeCompletedTasks();
      console.log('[TrashboxPage] Completed task purge successful, deleted:', result.deleted);
      alert(`Successfully purged ${result.deleted} completed tasks older than 30 days.`);
      await load();
    } catch (e:any) {
      console.error('[TrashboxPage] Error purging old completed tasks:', e.message);
      setError(e.message);
    } finally {
      setPurgingCompleted(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Trashbox</h1>
          <p className="text-sm text-text-secondary mt-1">
            Manage deleted and completed tasks. Completed tasks are automatically deleted after 30 days.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-brand text-white hover:bg-brand/90 transition-all shadow-neu-sm border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
          >
            Refresh
          </button>
          <button
            disabled={purging}
            onClick={onPurge}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-danger text-white hover:bg-danger/90 transition-all shadow-neu-sm disabled:opacity-50 disabled:cursor-not-allowed border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
          >
            {purging ? 'Purging...' : 'Purge Trash (>30d)'}
          </button>
          <button
            disabled={purgingCompleted}
            onClick={onPurgeCompleted}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-warning text-white hover:bg-warning/90 transition-all shadow-neu-sm disabled:opacity-50 disabled:cursor-not-allowed border-t border-l border-b border-r border-t-border-highlight border-l-border-highlight border-b-border-shadow border-r-border-shadow"
          >
            {purgingCompleted ? 'Purging...' : 'Purge Completed (>30d)'}
          </button>
        </div>
      </div>
      {error && <div className="text-danger text-sm bg-danger/10 border border-danger/30 rounded-lg p-3">{error}</div>}
      {loading ? (
        <div className="text-text-secondary">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-sm text-text-secondary bg-card-bg backdrop-blur-xl rounded-xl p-8 text-center shadow-neu-3d">
          Trash is empty
        </div>
      ) : (
        <div className="bg-card-bg backdrop-blur-xl rounded-xl shadow-neu-3d overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-card-bg-darker border-b border-border-shadow">
                  <th className="p-4 text-left font-semibold text-text-dark">Title</th>
                  <th className="p-4 text-left font-semibold text-text-dark">Status</th>
                  <th className="p-4 text-left font-semibold text-text-dark">Deleted At</th>
                  <th className="p-4 text-left font-semibold text-text-dark">Labels</th>
                  <th className="p-4 text-left font-semibold text-text-dark">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} className="border-t border-border-shadow hover:bg-card-bg-dark transition-colors">
                    <td className="p-4 text-text-primary font-medium">{t.title}</td>
                    <td className="p-4 text-text-secondary capitalize">{t.status}</td>
                    <td className="p-4 text-text-secondary">{t.deletedAt ? new Date(t.deletedAt).toLocaleString() : '—'}</td>
                    <td className="p-4 text-text-secondary">{t.labels.join(', ') || '—'}</td>
                    <td className="p-4 space-x-2">
                      <button
                        onClick={() => onRestore(t.id)}
                        className="px-3 py-1.5 bg-success text-white rounded-lg hover:bg-success/90 transition-all shadow-neu-sm text-xs font-semibold"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => onPermanentDelete(t.id)}
                        className="px-3 py-1.5 bg-danger text-white rounded-lg hover:bg-danger/90 transition-all shadow-neu-sm text-xs font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrashboxPage;
