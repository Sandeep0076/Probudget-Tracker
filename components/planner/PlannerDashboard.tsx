import React from 'react';
import { Task } from '../../types';
import * as api from '../../services/api';

interface PlannerDashboardProps {
  tasks: Task[];
  events: any[];
  onRefresh: () => void;
  onToggleComplete: (task: Task) => void;
  onToggleEvent: (event: any) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }>=({title,children})=> (
  <div className="relative bg-white backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-all duration-300 border border-white/40">
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
    <div className="relative flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">{title}</h3>
    </div>
    <div className="relative mt-3 space-y-2">{children}</div>
  </div>
);

const TaskRow: React.FC<{ task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void }>=({task,onToggle,onEdit,onDelete})=> (
  <div className="group flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors duration-200">
    <label className="flex items-center gap-2 cursor-pointer flex-1">
      <input type="checkbox" checked={task.status==='completed'} onChange={onToggle} className="w-4 h-4 rounded border-gray-300" />
      <span className={task.status==='completed'? 'line-through text-gray-400' : 'text-text-dark font-medium'}>{task.title}</span>
    </label>
    <div className="flex items-center gap-1">
      {task.due && <span className="text-xs text-warning font-semibold mr-2">{new Date(task.due).toLocaleDateString()}</span>}
      <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity" title="Edit">
        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity" title="Delete">
        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  </div>
);

const EventRow: React.FC<{ event: any; onToggle: () => void }>=({event, onToggle})=> {
  const title = event.summary || event.title || 'Event';
  const dt = event.start?.dateTime || event.start?.date || event.start;
  const when = dt ? new Date(dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const isCancelled = event.status === 'cancelled' || event.status === 'completed';
  
  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors duration-200">
      <label className="flex items-center gap-2 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={isCancelled}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className={isCancelled ? 'line-through text-gray-400' : 'text-gray-800'}>{title}</span>
      </label>
      {when && <span className={`text-xs font-medium ${isCancelled ? 'text-gray-400' : 'text-blue-600'}`}>{when}</span>}
    </div>
  );
};

const PlannerDashboard: React.FC<PlannerDashboardProps> = ({ tasks, events, onRefresh, onToggleComplete, onToggleEvent, onEditTask, onDeleteTask }) => {
  const now = new Date();
  const todayKey = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowKey = new Date(tomorrowDate.getTime() - tomorrowDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const isSameDay = (iso?: string|null, key?: string) => !!iso && iso.slice(0,10)===key;

  const overdue = tasks.filter(t => t.due && t.status!=='completed' && t.due < todayKey);
  const today = tasks.filter(t => isSameDay(t.start||t.due, todayKey));
  const tomorrow = tasks.filter(t => isSameDay(t.start||t.due, tomorrowKey));
  const someday = tasks.filter(t => !t.start && !t.due && t.status!=='completed');

  // Filter events for today and tomorrow
  const todayEvents = (events || []).filter((e: any) => {
    const eventDate = e.start?.dateTime || e.start?.date || e.start;
    return eventDate && isSameDay(eventDate, todayKey);
  });

  const tomorrowEvents = (events || []).filter((e: any) => {
    const eventDate = e.start?.dateTime || e.start?.date || e.start;
    return eventDate && isSameDay(eventDate, tomorrowKey);
  });

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
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back Mr and Mrs Pathania.</h1>
        <p className="text-text-secondary">Here's your task overview and schedule.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="space-y-4 lg:col-span-1">
        <div className="relative bg-white backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-all duration-300 border border-white/40">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <div className="relative flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">Upcoming Calendar</h3>
            <div className="flex gap-2">
              {events && events.length > 0 && (
                <>
                  <button onClick={handleDisconnectCalendar} className="text-xs text-warning hover:underline">Disconnect</button>
                  <button onClick={onRefresh} className="text-xs text-brand hover:underline">Refresh</button>
                </>
              )}
            </div>
          </div>
          <div className="relative mt-3 space-y-2">
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
              return <div key={e.id} className="text-sm flex items-start gap-2 w-full max-w-xs"><span className="mt-1 h-2 w-2 rounded-full bg-accent"/> <div><div className="font-semibold text-text-dark">{title}</div><div className="text-xs text-gray-600">{when}</div></div></div>
            })}
            {(!events || events.length===0) && (
              <div className="text-sm text-gray-600">
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
          {today.length===0 && todayEvents.length===0 && <div className="text-sm text-gray-600">No tasks for today.</div>}
          {todayEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
          {today.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
      </div>
      <div className="space-y-4 lg:col-span-1">
        <Section title="Overdue">
          {overdue.length===0 && <div className="text-sm text-gray-600">All clear.</div>}
          {overdue.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
        <Section title="Tomorrow">
          {tomorrow.length===0 && tomorrowEvents.length===0 && <div className="text-sm text-gray-600">Nothing yet.</div>}
          {tomorrowEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
          {tomorrow.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
      </div>
      <div className="lg:col-span-3">
        <Section title="Someday">
          {someday.length===0 && <div className="text-sm text-gray-600">No backlog items.</div>}
          {someday.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
      </div>
      </div>
    </>
  );
};

export default PlannerDashboard;
