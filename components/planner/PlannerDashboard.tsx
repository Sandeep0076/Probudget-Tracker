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
  <div className="bg-white rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-600">{title}</h3>
    </div>
    <div className="mt-3 space-y-2">{children}</div>
  </div>
);

const TaskRow: React.FC<{ task: Task; onToggle: () => void }>=({task,onToggle})=> (
  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200">
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={task.status==='completed'} onChange={onToggle} className="w-4 h-4 rounded border-gray-300" />
      <span className={task.status==='completed'? 'line-through text-gray-400' : 'text-gray-800'}>{task.title}</span>
    </label>
    {task.due && <span className="text-xs text-warning font-medium">{new Date(task.due).toLocaleDateString()}</span>}
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
        <div className="bg-white rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-600">Upcoming Calendar</h3>
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
              return <div key={e.id} className="text-sm flex items-start gap-2 w-full max-w-xs"><span className="mt-1 h-2 w-2 rounded-full bg-accent"/> <div><div className="font-medium text-gray-800">{title}</div><div className="text-xs text-gray-500">{when}</div></div></div>
            })}
            {(!events || events.length===0) && (
              <div className="text-sm text-gray-500">
                No calendar events.{" "}
                <button
                  className="text-brand underline hover:text-brand/80 transition-colors"
                  onClick={handleConnectCalendar}
                >Connect Google Calendar</button>.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-4 lg:col-span-1">
        <Section title="Today">
          {today.length===0 && <div className="text-sm text-gray-500">No tasks for today.</div>}
          {today.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
      </div>
      <div className="space-y-4 lg:col-span-1">
        <Section title="Overdue">
          {overdue.length===0 && <div className="text-sm text-gray-500">All clear.</div>}
          {overdue.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
        <Section title="Tomorrow">
          {tomorrow.length===0 && <div className="text-sm text-gray-500">Nothing yet.</div>}
          {tomorrow.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
      </div>
      <div className="lg:col-span-3">
        <Section title="Someday">
          {someday.length===0 && <div className="text-sm text-gray-500">No backlog items.</div>}
          {someday.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} />)}
        </Section>
      </div>
    </div>
  );
};

export default PlannerDashboard;
