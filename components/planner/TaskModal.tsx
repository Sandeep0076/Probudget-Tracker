import React, { useState, useEffect } from 'react';
import { Subtask, TaskPriority, TaskRepeat, TaskStatus } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  initial?: {
    id?: string;
    title?: string;
    notes?: string;
    priority?: TaskPriority;
    allDay?: boolean;
    start?: string | null;
    end?: string | null;
    due?: string | null;
    repeat?: TaskRepeat | null;
    color?: string | null;
    labels?: string[];
    subtasks?: Subtask[];
    estimatedTime?: string | null;
    status?: TaskStatus; // Added to preserve existing status on edit
    progress?: number | null; // For potential future conditional logic
    taskType?: 'todo' | 'schedule'; // Type of task
  };
  onClose: () => void;
  onSave: (data: any, id?: string) => Promise<void> | void;
}

const LabeledRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center gap-3">
    <div className="w-28 text-sm text-gray-600">{label}</div>
    <div className="flex-1">{children}</div>
  </div>
);

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, initial, onClose, onSave }) => {
  const taskType = initial?.taskType || 'todo';
  const isTodo = taskType === 'todo';

  const [title, setTitle] = useState(initial?.title || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority || 'medium');
  const [allDay, setAllDay] = useState<boolean>(!!initial?.allDay);
  const [start, setStart] = useState<string | ''>(initial?.start || '');
  const [end, setEnd] = useState<string | ''>(initial?.end || '');
  const [due, setDue] = useState<string | ''>(initial?.due || '');
  const [repeat, setRepeat] = useState<TaskRepeat | null>(initial?.repeat || null);
  const [color, setColor] = useState<string>(initial?.color || '#f59e0b');
  const [labels, setLabels] = useState<string>((initial?.labels || []).join(', '));
  const [subtasks, setSubtasks] = useState<Subtask[]>(initial?.subtasks || []);
  const [estimatedTime, setEstimatedTime] = useState<string>(initial?.estimatedTime || '');
  const [saving, setSaving] = useState(false);

  const commonInputClasses = "w-full px-3 py-2 bg-input-bg border border-input-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent shadow-inner";
  const commonSelectClasses = "px-2 py-1 rounded-md bg-input-bg border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent shadow-inner";

  // Helper function to format datetime for input fields
  const formatDateTimeForInput = (dateString?: string | null, isDateOnly: boolean = false): string => {
    if (!dateString) return '';
    try {
      // For DATE format (YYYY-MM-DD), create date with UTC timezone to avoid timezone issues
      const date = isDateOnly || dateString.length === 10
        ? new Date(dateString + 'T00:00:00.000Z')
        : new Date(dateString);

      if (isNaN(date.getTime())) return '';

      if (isDateOnly) {
        // For date input: yyyy-MM-dd (return as-is for DATE format)
        return dateString.length === 10 ? dateString : date.toISOString().split('T')[0];
      } else {
        // For datetime-local input: yyyy-MM-ddThh:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    } catch (e) {
      console.error('[TaskModal] Error formatting date:', dateString, e);
      return '';
    }
  };

  // Reset form state when modal opens or initial data changes
  useEffect(() => {
    if (isOpen) {
      console.log('[TaskModal] Modal opened with initial data:', initial);
      console.log('[TaskModal] Initial status from data:', initial?.status);
      console.log('[TaskModal] Initial has id?:', !!initial?.id);
      setTitle(initial?.title || '');
      setNotes(initial?.notes || '');
      setPriority(initial?.priority || 'medium');
      setAllDay(!!initial?.allDay);
      setStart(formatDateTimeForInput(initial?.start, true));  // Use DATE format
      setEnd(formatDateTimeForInput(initial?.end, true));    // Use DATE format
      setDue(formatDateTimeForInput(initial?.due, true));
      setRepeat(initial?.repeat || null);
      setColor(initial?.color || '#f59e0b');
      setLabels((initial?.labels || []).join(', '));
      setSubtasks(initial?.subtasks || []);
      setEstimatedTime(initial?.estimatedTime || '');
      setSaving(false);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { id: Math.random().toString(36).slice(2), taskId: '', title: '', done: false }]);
  };

  const handleSave = async () => {
    if (saving) {
      console.log('[TaskModal] Save already in progress, ignoring duplicate click');
      return;
    }

    console.log('[TaskModal] Saving task with data:', { title, notes, priority, allDay, start, end, due });
    setSaving(true);
    try {
      // Determine status intelligently:
      // - New task: scheduled if it has start/due, else backlog
      // - Existing task: NEVER downgrade in_progress or completed back to scheduled
      //   just because it has start/due. Only auto-set to scheduled if prior status was
      //   backlog/new and user added schedule info. Otherwise preserve existing.
      let taskStatus: TaskStatus;
      console.log('[TaskModal] Status determination - isEdit:', !!initial?.id, 'initial.status:', initial?.status, 'hasSchedule:', Boolean(start || due));

      if (!initial?.id) {
        taskStatus = (start || due) ? 'scheduled' : 'backlog';
        console.log('[TaskModal] New task status:', taskStatus);
      } else {
        const prevStatus = initial.status as TaskStatus | undefined;
        const hasSchedule = Boolean(start || due);
        if (!prevStatus) {
          taskStatus = hasSchedule ? 'scheduled' : 'backlog';
          console.log('[TaskModal] No prev status, defaulting to:', taskStatus);
        } else if (['in_progress', 'completed'].includes(prevStatus)) {
          // Preserve active/finished states regardless of schedule fields
          taskStatus = prevStatus;
          console.log('[TaskModal] Preserving active/completed status:', taskStatus);
        } else if (['backlog', 'new'].includes(prevStatus)) {
          // Upgrade backlog/new to scheduled if schedule added, else keep
          taskStatus = hasSchedule ? 'scheduled' : prevStatus;
          console.log('[TaskModal] Upgrading backlog/new status:', taskStatus);
        } else {
          // For any other custom status, preserve it
          taskStatus = prevStatus;
          console.log('[TaskModal] Preserving custom status:', taskStatus);
        }
        console.log('[TaskModal] Status resolution for edit:', {
          prevStatus,
          hasSchedule,
          chosenStatus: taskStatus,
          start,
          due
        });
      }

      const payload: any = {
        title: title.trim(),
        notes: notes.trim(),
        priority,
        allDay: isTodo ? false : allDay, // All day only for schedule tasks
        start: isTodo ? null : (start || null), // No start date for todo tasks
        end: isTodo ? null : (end || null), // No end date for todo tasks
        due: due || null,
        repeat: repeat || null,
        color,
        labels: isTodo ? [] : labels.split(',').map(s => s.trim()).filter(Boolean), // No labels for todo tasks
        subtasks: subtasks.map(s => ({ title: s.title, done: s.done })),
        status: taskStatus,
        estimatedTime: estimatedTime.trim() || null,
        taskType: taskType
      };
      console.log('[TaskModal] Task will be saved with status:', taskStatus, 'payload:', payload);
      await onSave(payload, initial?.id);
      console.log('[TaskModal] Task saved successfully');
      onClose();
    } catch (error) {
      console.error('[TaskModal] Error saving task:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-xl modal-content bg-modal-bg backdrop-blur-xl rounded-xl p-4 sm:p-6 shadow-neu-3d max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-text-primary">{initial?.id ? 'Edit Task' : (isTodo ? 'New Task' : 'New Schedule')}</h3>
          <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>✕</button>
        </div>

        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name of the task"
            className={commonInputClasses}
          />

          <LabeledRow label="Priority">
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)} className={commonSelectClasses}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </LabeledRow>

          <LabeledRow label="Estimated Time">
            <input
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              placeholder="e.g., 5 min, 2 hours, 2-3 days"
              className={commonInputClasses}
            />
          </LabeledRow>

          {isTodo ? (
            <>
              <LabeledRow label="Deadline">
                <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={commonInputClasses} />
              </LabeledRow>
              <LabeledRow label="Repeat">
                <select
                  value={repeat?.type || 'none'}
                  onChange={(e) => {
                    const t = e.target.value;
                    if (t === 'none') setRepeat(null);
                    else setRepeat({ type: t as any, interval: 1 });
                  }}
                  className={commonSelectClasses}
                >
                  <option value="none">None</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </LabeledRow>
              {repeat?.type === 'monthly' && (
                <div className="flex gap-3 ml-[124px]">
                  <select
                    value={(repeat as any).monthlyMode || 'on_day'}
                    onChange={(e) => setRepeat({ ...(repeat as any), monthlyMode: e.target.value as any })}
                    className={commonSelectClasses}
                  >
                    <option value="on_day">On day</option>
                    <option value="last_day">Last day</option>
                  </select>
                  {(repeat as any).monthlyMode !== 'last_day' && (
                    <input type="number" min={1} max={31} value={(repeat as any).dayOfMonth || 1} onChange={(e) => setRepeat({ ...(repeat as any), dayOfMonth: Number(e.target.value) })} className={`${commonInputClasses} w-24`} />
                  )}
                </div>
              )}
            </>
          ) : (
            <details className="bg-input-bg rounded-lg p-4 border border-input-border shadow-inner">
              <summary className="cursor-pointer select-none text-text-primary">Schedule</summary>
              <div className="mt-3 space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} /> All Day
                </label>
                <LabeledRow label="From">
                  <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={commonInputClasses} />
                </LabeledRow>
                <LabeledRow label="To">
                  <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={commonInputClasses} />
                </LabeledRow>
                <LabeledRow label="Deadline">
                  <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={commonInputClasses} />
                </LabeledRow>
                <LabeledRow label="Repeat">
                  <select
                    value={repeat?.type || 'none'}
                    onChange={(e) => {
                      const t = e.target.value;
                      if (t === 'none') setRepeat(null);
                      else setRepeat({ type: t as any, interval: 1 });
                    }}
                    className={commonSelectClasses}
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </LabeledRow>
                {repeat?.type === 'monthly' && (
                  <div className="flex gap-3">
                    <select
                      value={(repeat as any).monthlyMode || 'on_day'}
                      onChange={(e) => setRepeat({ ...(repeat as any), monthlyMode: e.target.value as any })}
                      className={commonSelectClasses}
                    >
                      <option value="on_day">On day</option>
                      <option value="last_day">Last day</option>
                    </select>
                    {(repeat as any).monthlyMode !== 'last_day' && (
                      <input type="number" min={1} max={31} value={(repeat as any).dayOfMonth || 1} onChange={(e) => setRepeat({ ...(repeat as any), dayOfMonth: Number(e.target.value) })} className={`${commonInputClasses} w-24`} />
                    )}
                  </div>
                )}
              </div>
            </details>
          )}

          <LabeledRow label="Color">
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          </LabeledRow>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className={commonInputClasses}
          />

          {!isTodo && (
            <LabeledRow label="Labels">
              <input value={labels} onChange={(e) => setLabels(e.target.value)} placeholder="comma,separated" className={commonInputClasses} />
            </LabeledRow>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-secondary">Subtasks</div>
              <button className="text-sm text-brand" onClick={handleAddSubtask}>+ Add</button>
            </div>
            <div className="space-y-2">
              {subtasks.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={s.done} onChange={(e) => {
                    const arr = [...subtasks];
                    arr[idx] = { ...s, done: e.target.checked };
                    setSubtasks(arr);
                  }} />
                  <input value={s.title} onChange={(e) => {
                    const arr = [...subtasks];
                    arr[idx] = { ...s, title: e.target.value };
                    setSubtasks(arr);
                  }} placeholder="Subtask title" className={`${commonInputClasses} flex-1`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} disabled={saving} className="custom-styled px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-all shadow-neu-xs disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
          <button disabled={saving || !title.trim()} onClick={handleSave} className="custom-styled px-4 py-2 rounded-md bg-button-primary text-button-text hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neu-sm">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
