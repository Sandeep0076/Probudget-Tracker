import React, { useState, useEffect } from 'react';
import { Subtask, TaskPriority, TaskRepeat, Task, TaskStatus } from '../../types';

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
  };
  onClose: () => void;
  onSave: (data: any, id?: string) => Promise<void> | void;
}

const LabeledRow: React.FC<{ label: string; children: React.ReactNode }>=({label,children})=> (
  <div className="flex items-center gap-3">
    <div className="w-28 text-sm text-gray-600">{label}</div>
    <div className="flex-1">{children}</div>
  </div>
);

const TaskModal: React.FC<TaskModalProps> = ({ isOpen, initial, onClose, onSave }) => {
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
  const [saving, setSaving] = useState(false);

  const commonInputClasses = "w-full px-3 py-2 bg-input-bg border border-input-border rounded-md text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent shadow-inner";
  const commonSelectClasses = "px-2 py-1 rounded-md bg-input-bg border border-input-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent shadow-inner";

  // Helper function to format datetime for input fields
  const formatDateTimeForInput = (dateString?: string | null, isDateOnly: boolean = false): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      if (isDateOnly) {
        // For date input: yyyy-MM-dd
        return date.toISOString().split('T')[0];
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
      setTitle(initial?.title || '');
      setNotes(initial?.notes || '');
      setPriority(initial?.priority || 'medium');
      setAllDay(!!initial?.allDay);
      setStart(formatDateTimeForInput(initial?.start, false));
      setEnd(formatDateTimeForInput(initial?.end, false));
      setDue(formatDateTimeForInput(initial?.due, true));
      setRepeat(initial?.repeat || null);
      setColor(initial?.color || '#f59e0b');
      setLabels((initial?.labels || []).join(', '));
      setSubtasks(initial?.subtasks || []);
      setSaving(false);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { id: Math.random().toString(36).slice(2), taskId: '', title: '', done: false }]);
  };

  const handleSave = async () => {
    console.log('[TaskModal] Saving task with data:', { title, notes, priority, allDay, start, end, due });
    setSaving(true);
    try {
      // Determine status: if editing existing task, keep its status; otherwise set based on schedule
      let taskStatus: TaskStatus;
      if (initial?.id) {
        // Editing existing task - keep current status unless it has schedule info
        taskStatus = (start || due) ? 'scheduled' : ((initial as any).status || 'backlog');
      } else {
        // New task - default to backlog unless it has schedule info
        taskStatus = (start || due) ? 'scheduled' : 'backlog';
      }
      
      const payload: any = {
        title: title.trim(),
        notes: notes.trim(),
        priority,
        allDay,
        start: start || null,
        end: end || null,
        due: due || null,
        repeat: repeat || null,
        color,
        labels: labels.split(',').map(s=>s.trim()).filter(Boolean),
        subtasks: subtasks.map(s=>({ title: s.title, done: s.done })),
        status: taskStatus
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
          <h3 className="text-xl font-semibold text-text-primary">{initial?.id ? 'Edit Task' : 'New Task'}</h3>
          <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={onClose}>✕</button>
        </div>

        <div className="space-y-4">
          <input
            value={title}
            onChange={(e)=>setTitle(e.target.value)}
            placeholder="Name of the task"
            className={commonInputClasses}
          />

          <LabeledRow label="Priority">
            <select value={priority} onChange={e=>setPriority(e.target.value as TaskPriority)} className={commonSelectClasses}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </LabeledRow>

          <details className="bg-input-bg rounded-lg p-4 border border-input-border shadow-inner">
            <summary className="cursor-pointer select-none text-text-primary">Schedule</summary>
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={allDay} onChange={(e)=>setAllDay(e.target.checked)} /> All Day
              </label>
              <LabeledRow label="From">
                <input type="datetime-local" value={start} onChange={(e)=>setStart(e.target.value)} className={commonInputClasses} />
              </LabeledRow>
              <LabeledRow label="To">
                <input type="datetime-local" value={end} onChange={(e)=>setEnd(e.target.value)} className={commonInputClasses} />
              </LabeledRow>
              <LabeledRow label="Deadline">
                <input type="date" value={due} onChange={(e)=>setDue(e.target.value)} className={commonInputClasses} />
              </LabeledRow>
              <LabeledRow label="Repeat">
                <select
                  value={repeat?.type || 'none'}
                  onChange={(e)=>{
                    const t = e.target.value;
                    if (t==='none') setRepeat(null);
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
              {repeat?.type==='monthly' && (
                <div className="flex gap-3">
                  <select
                    value={(repeat as any).monthlyMode || 'on_day'}
                    onChange={(e)=>setRepeat({ ...(repeat as any), monthlyMode: e.target.value as any })}
                    className={commonSelectClasses}
                  >
                    <option value="on_day">On day</option>
                    <option value="last_day">Last day</option>
                  </select>
                  {(repeat as any).monthlyMode!=='last_day' && (
                    <input type="number" min={1} max={31} value={(repeat as any).dayOfMonth || 1} onChange={(e)=>setRepeat({ ...(repeat as any), dayOfMonth: Number(e.target.value) })} className={`${commonInputClasses} w-24`} />
                  )}
                </div>
              )}
            </div>
          </details>

          <LabeledRow label="Color">
            <input type="color" value={color} onChange={(e)=>setColor(e.target.value)} />
          </LabeledRow>

          <textarea
            value={notes}
            onChange={(e)=>setNotes(e.target.value)}
            placeholder="Notes"
            className={commonInputClasses}
          />

          <LabeledRow label="Labels">
            <input value={labels} onChange={(e)=>setLabels(e.target.value)} placeholder="comma,separated" className={commonInputClasses} />
          </LabeledRow>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-text-secondary">Subtasks</div>
              <button className="text-sm text-brand" onClick={handleAddSubtask}>+ Add</button>
            </div>
            <div className="space-y-2">
              {subtasks.map((s,idx)=> (
                <div key={s.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={s.done} onChange={(e)=>{
                    const arr=[...subtasks];
                    arr[idx] = { ...s, done: e.target.checked };
                    setSubtasks(arr);
                  }} />
                  <input value={s.title} onChange={(e)=>{
                    const arr=[...subtasks];
                    arr[idx] = { ...s, title: e.target.value };
                    setSubtasks(arr);
                  }} placeholder="Subtask title" className={`${commonInputClasses} flex-1`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="custom-styled px-4 py-2 rounded-md bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 transition-all shadow-neu-xs">Cancel</button>
          <button disabled={saving || !title.trim()} onClick={handleSave} className="custom-styled px-4 py-2 rounded-md bg-button-primary text-button-text hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neu-sm">Save</button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
