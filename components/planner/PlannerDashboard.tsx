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
  username: string;
}

const Section: React.FC<{ title: string; children: React.ReactNode }>=({title,children})=> (
  <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">{title}</h3>
    </div>
    <div className="mt-3 space-y-2">{children}</div>
  </div>
);

const TaskRow: React.FC<{ task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void }>=({task,onToggle,onEdit,onDelete})=> (
  <div className="group flex items-center justify-between px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
    <label className="flex items-center gap-3 cursor-pointer flex-1">
      <input type="checkbox" checked={task.status==='completed'} onChange={onToggle} className="w-4 h-4 rounded border-gray-300" />
      <span className={task.status==='completed'? 'line-through text-text-muted' : 'text-text-primary font-semibold'}>{task.title}</span>
    </label>
    <div className="flex items-center gap-1">
      {task.due && <span className="text-xs text-warning font-bold mr-2">{new Date(task.due).toLocaleDateString()}</span>}
      <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-border-highlight rounded-lg transition-opacity" title="Edit">
        <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-danger/10 rounded-lg transition-opacity" title="Delete">
        <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
      <label className="flex items-center gap-3 cursor-pointer flex-1">
        <input
          type="checkbox"
          checked={isCancelled}
          onChange={onToggle}
          className="w-4 h-4 rounded border-gray-300"
        />
        <span className={isCancelled ? 'line-through text-text-muted' : 'text-text-primary font-semibold'}>{title}</span>
      </label>
      {when && <span className={`text-xs font-bold ${isCancelled ? 'text-text-muted' : 'text-accent'}`}>{when}</span>}
    </div>
  );
};

const PlannerDashboard: React.FC<PlannerDashboardProps> = ({ tasks, events, onRefresh, onToggleComplete, onToggleEvent, onEditTask, onDeleteTask, username }) => {
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
        <h1 className="text-2xl font-bold text-text-primary">Welcome back {username}.</h1>
        <p className="text-text-secondary">Here's your task overview and schedule.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Today section - appears first on mobile/tablet, second on desktop */}
      <div className="space-y-4 lg:col-span-1 lg:order-2">
        <Section title="Today">
          {today.length===0 && todayEvents.length===0 && <div className="text-sm text-text-secondary">No tasks for today.</div>}
          {todayEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
          {today.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
      </div>
      {/* Upcoming Calendar - appears second on mobile/tablet, first on desktop */}
      <div className="space-y-4 lg:col-span-1 lg:order-1">
        <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
          <div className="flex items-center justify-between">
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
              return <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5"><span className="h-2 w-2 rounded-full bg-accent flex-shrink-0"/> <div className="flex-1 min-w-0"><div className="font-semibold text-text-primary truncate">{title}</div><div className="text-xs text-text-secondary font-medium">{when}</div></div></div>
            })}
            {(!events || events.length===0) && (
              <div className="text-sm text-text-secondary">
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
      {/* Overdue and Tomorrow - appears third on mobile/tablet, third on desktop */}
      <div className="space-y-4 lg:col-span-1 lg:order-3">
        <Section title="Overdue">
          {overdue.length===0 && <div className="text-sm text-text-secondary">All clear.</div>}
          {overdue.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
        <Section title="Tomorrow">
          {tomorrow.length===0 && tomorrowEvents.length===0 && <div className="text-sm text-text-secondary">Nothing yet.</div>}
          {tomorrowEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
          {tomorrow.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
      </div>
      {/* Someday section - always appears at the bottom */}
      <div className="lg:col-span-3 order-last">
        <Section title="Someday">
          {someday.length===0 && <div className="text-sm text-text-secondary">No backlog items.</div>}
          {someday.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} />)}
        </Section>
      </div>
      </div>
    </>
  );
};

export default PlannerDashboard;
