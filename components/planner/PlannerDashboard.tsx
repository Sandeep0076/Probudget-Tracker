import React from 'react';
import { Task } from '../../types';
import * as api from '../../services/api';

interface PlannerDashboardProps {
  tasks: Task[];
  events: any[];
  onRefresh: () => void;
  onToggleComplete: (task: Task) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }>=({title,children})=> (
  <div className="bg-surface/70 border border-border-shadow rounded-xl p-4 shadow-neu-sm">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-text-secondary">{title}</h3>
    </div>
    <div className="mt-3 space-y-2">{children}</div>
  </div>
);

const TaskRow: React.FC<{ task: Task; onToggle: () => void }>=({task,onToggle})=> (
  <div className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-surface/60">
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={task.status==='completed'} onChange={onToggle} />
      <span className={task.status==='completed'? 'line-through text-text-muted' : ''}>{task.title}</span>
    </label>
    {task.due && <span className="text-xs text-warning">{new Date(task.due).toLocaleDateString()}</span>}
  </div>
);

const PlannerDashboard: React.FC<PlannerDashboardProps> = ({ tasks, events, onRefresh, onToggleComplete }) => {
  const now = new Date();
  const todayKey = now.toISOString().slice(0,10);
  const tomorrowKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1).toISOString().slice(0,10);

  const isSameDay = (iso?: string|null, key?: string) => !!iso && iso.slice(0,10)===key;

  const overdue = tasks.filter(t => t.due && t.status!=='completed' && t.due < todayKey);
  const today = tasks.filter(t => isSameDay(t.start||t.due, todayKey));
  const tomorrow = tasks.filter(t => isSameDay(t.start||t.due, tomorrowKey));
  const someday = tasks.filter(t => !t.start && !t.due && t.status!=='completed');

  const handleConnectCalendar = async () => {
    try {
      const { url } = await api.getCalendarAuthUrl();
      const popup = window.open(url, '_blank', 'width=480,height=640');
      if (popup) {
        const poll = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(poll);
            onRefresh();
          }
        }, 1500);
      }
      window.setTimeout(() => {
        onRefresh();
      }, 5000);
    } catch (err) {
      console.error('Failed to connect calendar', err);
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      await api.disconnectCalendar();
      onRefresh();
    } catch (err) {
      console.error('Failed to disconnect calendar', err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="space-y-4 lg:col-span-1">
        <div className="bg-surface/70 border border-border-shadow rounded-xl p-4 shadow-neu-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-text-secondary">Upcoming Calendar</h3>
            <div className="flex gap-2">
              {events && events.length > 0 && (
                <>
                  <button onClick={handleDisconnectCalendar} className="text-xs text-warning hover:underline">Disconnect</button>
                  <button onClick={onRefresh} className="text-xs text-brand hover:underline">Refresh</button>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {(events||[])
              .filter((e: any) => {
                const eventDate = new Date(e.start?.dateTime || e.start?.date || e.start);
                const today = new Date();
                const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
                return eventDate >= today && eventDate <= nextWeek;
              })
              .slice(0,8).map((e:any)=>{
              const title = e.summary || e.title || 'Event';
              const dt = e.start?.dateTime || e.start?.date || e.start;
              const when = dt ? new Date(dt).toLocaleString() : '';
              return <div key={e.id} className="text-sm flex items-start gap-2 w-full max-w-xs"><span className="mt-1 h-2 w-2 rounded-full bg-accent"/> <div><div className="font-medium">{title}</div><div className="text-xs text-text-secondary">{when}</div></div></div>
            })}
            {(!events || events.length===0) && (
              <div className="text-sm text-text-muted">
                No calendar events.{" "}
                <button
                  className="text-brand underline"
                  onClick={handleConnectCalendar}
                >Connect Google Calendar</button>.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4 lg:col-span-1">
        <Section title="Today">
          {today.length===0 && <div className="text-sm text-text-muted">No tasks for today.</div>}
          {today.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
      </div>
      <div className="space-y-4 lg:col-span-1">
        <Section title="Overdue">
          {overdue.length===0 && <div className="text-sm text-text-muted">All clear.</div>}
          {overdue.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
        <Section title="Tomorrow">
          {tomorrow.length===0 && <div className="text-sm text-text-muted">Nothing yet.</div>}
          {tomorrow.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
      </div>
      <div className="lg:col-span-3">
        <Section title="Someday">
          {someday.length===0 && <div className="text-sm text-text-muted">No backlog items.</div>}
          {someday.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
      </div>
    </div>
  );
};

export default PlannerDashboard;
