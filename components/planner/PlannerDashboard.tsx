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
  onConvertToSchedule?: (taskId: string) => void;
  username: string;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">{title}</h3>
    </div>
    <div className="mt-3 space-y-2">{children}</div>
  </div>
);

const TaskRow: React.FC<{ task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void; onConvertToSchedule?: () => void }> = ({ task, onToggle, onEdit, onDelete, onConvertToSchedule }) => (
  <div className="group flex items-center justify-between px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
    <label className="flex items-center gap-3 cursor-pointer flex-1">
      <input type="checkbox" checked={task.status === 'completed'} onChange={onToggle} className="w-4 h-4 rounded border-gray-300" />
      <span className={task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary font-semibold'}>{task.title}</span>
    </label>
    <div className="flex items-center gap-1">
      {task.due && <span className="text-xs text-warning font-bold mr-2">{new Date(task.due + 'T00:00:00.000Z').toLocaleDateString()}</span>}
      {onConvertToSchedule && (
        <button onClick={onConvertToSchedule} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-brand/10 rounded-lg transition-opacity" title="Convert to Schedule">
          <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </button>
      )}
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

const EventRow: React.FC<{ event: any; onToggle: () => void }> = ({ event, onToggle }) => {
  const title = event.summary || event.title || 'Event';
  const dt = event.start?.dateTime || event.start?.date || event.start;
  const when = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
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

const PlannerDashboard: React.FC<PlannerDashboardProps> = ({ tasks, events, onRefresh, onToggleComplete, onToggleEvent, onEditTask, onDeleteTask, onConvertToSchedule, username }) => {
  const now = new Date();
  const todayKey = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowKey = new Date(tomorrowDate.getTime() - tomorrowDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const isSameDay = (iso?: string | null, key?: string) => !!iso && iso.slice(0, 10) === key;

  const overdue = tasks.filter(t => t.due && t.status !== 'completed' && t.due < todayKey);
  const today = tasks.filter(t => isSameDay(t.start || t.due, todayKey));
  const tomorrow = tasks.filter(t => isSameDay(t.start || t.due, tomorrowKey));
  const someday = tasks.filter(t => !t.start && !t.due && t.status !== 'completed');

  console.log('[PlannerDashboard] Filtering someday tasks - total tasks:', tasks.length, 'someday tasks:', someday.length);
  console.log('[PlannerDashboard] Someday tasks:', someday.map(t => ({ id: t.id, title: t.title, status: t.status })));

  // Filter events for today and tomorrow
  const todayEvents = (events || []).filter((e: any) => {
    const eventDate = e.start?.dateTime || e.start?.date || e.start;
    return eventDate && isSameDay(eventDate, todayKey);
  });

  const tomorrowEvents = (events || []).filter((e: any) => {
    const eventDate = e.start?.dateTime || e.start?.date || e.start;
    return eventDate && isSameDay(eventDate, tomorrowKey);
  });

  // Google Calendar integration removed
  const handleConnectCalendar = async () => { };
  const handleDisconnectCalendar = async () => { };

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
            {today.length === 0 && todayEvents.length === 0 && <div className="text-sm text-text-secondary">No tasks for today.</div>}
            {todayEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
            {today.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </Section>
        </div>
        {/* Upcoming Calendar - appears second on mobile/tablet, first on desktop */}
        <div className="space-y-4 lg:col-span-1 lg:order-1">
          <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">Upcoming Calendar</h3>
              <div className="flex gap-2">
                {/* Google Calendar buttons removed */}
              </div>
            </div>
            <div className="relative mt-3 space-y-2">
              {(() => {
                console.log('[PlannerDashboard] Rendering Upcoming Calendar section');

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const nextWeeks = new Date(today);
                nextWeeks.setDate(today.getDate() + 28); // 4 weeks
                nextWeeks.setHours(23, 59, 59, 999);

                // Helper to get date object from item
                const getItemDate = (item: any, type: 'event' | 'task') => {
                  if (type === 'event') {
                    const val = item.start?.dateTime || item.start?.date || item.start;
                    return val ? new Date(val) : null;
                  } else {
                    // For tasks, prefer start date, then due date
                    if (item.start) return new Date(item.start);
                    if (item.due) return new Date(item.due + 'T00:00:00');
                    return null;
                  }
                };

                // Filter and map events
                const upcomingEvents = (events || [])
                  .map((e: any) => ({ ...e, itemType: 'event' }))
                  .filter((e: any) => {
                    const date = getItemDate(e, 'event');
                    const isCancelled = e.status === 'cancelled' || e.status === 'completed';
                    return date && date >= today && date <= nextWeeks && !isCancelled;
                  });

                // Filter and map tasks
                // Exclude completed tasks and ensure no trash is shown (backend filters trash, we filter completed)
                const upcomingTasks = tasks
                  .filter(t => t.status !== 'completed')
                  .map(t => ({ ...t, itemType: 'task' }))
                  .filter(t => {
                    const date = getItemDate(t, 'task');
                    return date && date >= today && date <= nextWeeks;
                  });

                // Combine and sort
                const allUpcoming = [...upcomingEvents, ...upcomingTasks].sort((a, b) => {
                  const dateA = getItemDate(a, a.itemType);
                  const dateB = getItemDate(b, b.itemType);
                  return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
                });

                console.log('[PlannerDashboard] Total upcoming items:', allUpcoming.length);

                if (allUpcoming.length === 0) {
                  return (
                    <div className="text-sm text-text-secondary">
                      No upcoming tasks or events in the next 4 weeks.
                    </div>
                  );
                }

                return allUpcoming.map((item: any) => {
                  const isEvent = item.itemType === 'event';
                  const title = isEvent ? (item.summary || item.title || 'Event') : item.title;
                  const date = getItemDate(item, item.itemType);

                  let when = '';
                  if (date) {
                    when = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    if (isEvent && item.start?.dateTime) {
                      when += ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                  }

                  return (
                    <div key={`${item.itemType}-${item.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${isEvent ? 'bg-accent' : 'bg-brand'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-text-primary truncate">{title}</div>
                          {!isEvent && item.priority && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${item.priority === 'high' ? 'bg-danger/10 text-danger' :
                              item.priority === 'medium' ? 'bg-warning/10 text-warning' :
                                'bg-success/10 text-success'
                              }`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                          <span className="uppercase tracking-wider">{item.itemType}</span>
                          <span>•</span>
                          <span>{when}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
        {/* Overdue and Tomorrow - appears third on mobile/tablet, third on desktop */}
        <div className="space-y-4 lg:col-span-1 lg:order-3">
          <Section title="Overdue">
            {overdue.length === 0 && <div className="text-sm text-text-secondary">All clear.</div>}
            {overdue.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </Section>
          <Section title="Tomorrow">
            {tomorrow.length === 0 && tomorrowEvents.length === 0 && <div className="text-sm text-text-secondary">Nothing yet.</div>}
            {tomorrowEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
            {tomorrow.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </Section>
        </div>
        {/* Someday section - always appears at the bottom */}
        <div className="lg:col-span-3 order-last">
          <Section title="Someday">
            {someday.length === 0 && <div className="text-sm text-text-secondary">No backlog items.</div>}
            {someday.map(t => <TaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </Section>
        </div>
      </div>
    </>
  );
};

export default PlannerDashboard;
