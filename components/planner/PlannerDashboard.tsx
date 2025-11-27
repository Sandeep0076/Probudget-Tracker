import React, { useState } from 'react';
import { Task } from '../../types';
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlannerDashboardProps {
  tasks: Task[];
  events: any[];
  onRefresh: () => void;
  onToggleComplete: (task: Task) => void;
  onToggleEvent: (event: any) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onConvertToSchedule?: (taskId: string) => void;
  onUpdateTask: (taskId: string, patch: any) => void;
  username: string;
}

const DroppableSection: React.FC<{ id: string; title: string; children: React.ReactNode; className?: string; maxHeight?: string; minHeight?: string; scrollable?: boolean }> = ({ id, title, children, className, maxHeight, minHeight, scrollable }) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-all duration-300 ${isOver ? 'ring-2 ring-brand shadow-[0_0_20px_var(--color-brand)]' : ''} ${className || ''}`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">{title}</h3>
      </div>
      <div className={`mt-2 space-y-2.5 ${scrollable ? 'overflow-y-auto p-2 pb-3' : 'p-2 pb-3'} ${minHeight || 'min-h-[50px]'} ${maxHeight || ''}`}>{children}</div>
    </div>
  );
};

const DraggableTaskRow: React.FC<{ task: Task; onToggle: () => void; onEdit: () => void; onDelete: () => void; onConvertToSchedule?: () => void }> = ({ task, onToggle, onEdit, onDelete, onConvertToSchedule }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 flex items-center justify-between px-4 py-3 rounded-xl bg-card-bg border-2 border-brand border-dashed"
      >
        <span className="font-semibold text-text-primary">{task.title}</span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group flex items-start gap-3 px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5 touch-none"
    >
      <input
        type="checkbox"
        checked={task.status === 'completed'}
        onChange={(e) => { e.stopPropagation(); onToggle(); }}
        className="w-4 h-4 mt-1 rounded border-gray-300 cursor-pointer flex-shrink-0"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`font-semibold ${task.status === 'completed' ? 'line-through text-text-muted' : 'text-text-primary'}`}>
            {task.title}
          </span>
          {task.priority && (
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded flex-shrink-0 ${task.priority === 'high' ? 'bg-danger/20 text-danger' :
              task.priority === 'medium' ? 'bg-warning/20 text-warning' :
                'bg-text-muted/20 text-text-muted'
              }`}>
              {task.priority}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
          <span className="uppercase tracking-wider font-medium">
            {task.taskType === 'schedule' ? 'SCHEDULE' : 'TASK'}
          </span>
          {(task.start || task.due) && (
            <>
              <span>•</span>
              <span>
                {task.start ? new Date(task.start).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) :
                  task.due ? new Date(task.due + 'T00:00:00.000Z').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {onConvertToSchedule && (
          <button
            onClick={(e) => { e.stopPropagation(); onConvertToSchedule(); }}
            className="p-1.5 hover:bg-brand/10 rounded-lg"
            title="Convert to Schedule"
          >
            <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 hover:bg-border-highlight rounded-lg"
          title="Edit"
        >
          <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 hover:bg-danger/10 rounded-lg"
          title="Delete"
        >
          <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

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

const PlannerDashboard: React.FC<PlannerDashboardProps> = ({ tasks, events, onRefresh, onToggleComplete, onToggleEvent, onEditTask, onDeleteTask, onConvertToSchedule, onUpdateTask, username }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  console.log('[PlannerDashboard] Rendering with mobile order: Today -> Tomorrow -> Overdue -> Upcoming Calendar -> Someday');

  const now = new Date();
  const todayKey = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowKey = new Date(tomorrowDate.getTime() - tomorrowDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const isSameDay = (iso?: string | null, key?: string) => !!iso && iso.slice(0, 10) === key;

  const overdue = tasks.filter(t => t.due && t.status !== 'completed' && t.due < todayKey);
  const today = tasks.filter(t => isSameDay(t.start || t.due, todayKey));
  const tomorrow = tasks.filter(t => isSameDay(t.start || t.due, tomorrowKey));
  const upcomingDate = new Date(now);
  upcomingDate.setDate(now.getDate() + 7);
  const upcomingKey = new Date(upcomingDate.getTime() - upcomingDate.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  const someday = tasks.filter(t => {
    if (t.status === 'completed') return false;
    const date = t.start || t.due;
    if (!date) return true;
    return date > upcomingKey;
  });

  // Filter events for today and tomorrow
  const todayEvents = (events || []).filter((e: any) => {
    const eventDate = e.start?.dateTime || e.start?.date || e.start;
    return eventDate && isSameDay(eventDate, todayKey);
  });

  const tomorrowEvents = (events || []).filter((e: any) => {
    const eventDate = e.start?.dateTime || e.start?.date || e.start;
    return eventDate && isSameDay(eventDate, tomorrowKey);
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const destination = over.id as string;

    console.log('[PlannerDashboard] Drag ended. Task:', taskId, 'Destination:', destination);

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    let patch: any = {};

    switch (destination) {
      case 'today':
        patch = { start: todayKey, due: todayKey };
        break;
      case 'tomorrow':
        patch = { start: tomorrowKey, due: tomorrowKey };
        break;
      case 'someday':
        // Clear dates or set to future? Let's clear them for "Someday" bucket behavior
        // Or set to null to indicate "no specific date"
        patch = { start: null, due: null };
        break;
      case 'overdue':
        // If dragged TO overdue, maybe treat as today? Or just ignore?
        // Let's treat as Today for now, as you can't really schedule something to be "overdue"
        patch = { start: todayKey, due: todayKey };
        break;
      default:
        return;
    }

    onUpdateTask(taskId, patch);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Welcome back {username}.</h1>
        <p className="text-text-secondary">Here's your task overview and schedule.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Upcoming Calendar - order-4 on mobile, order-1 on desktop */}
        <div className="space-y-4 lg:col-span-1 order-4 lg:order-1">
          <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide uppercase text-text-dark">Upcoming Calendar</h3>
            </div>
            <div className="relative mt-2 space-y-2.5 max-h-[480px] overflow-y-auto p-2 pb-3">
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Start from day after tomorrow (2 days from now)
                const dayAfterTomorrow = new Date(today);
                dayAfterTomorrow.setDate(today.getDate() + 2);
                dayAfterTomorrow.setHours(0, 0, 0, 0);

                // End at 7 days from now
                const nextWeeks = new Date(today);
                nextWeeks.setDate(today.getDate() + 7);
                nextWeeks.setHours(23, 59, 59, 999);

                const getItemDate = (item: any, type: 'event' | 'task') => {
                  if (type === 'event') {
                    const val = item.start?.dateTime || item.start?.date || item.start;
                    return val ? new Date(val) : null;
                  } else {
                    if (item.start) return new Date(item.start);
                    if (item.due) return new Date(item.due + 'T00:00:00');
                    return null;
                  }
                };

                const upcomingEvents = (events || [])
                  .map((e: any) => ({ ...e, itemType: 'event' }))
                  .filter((e: any) => {
                    const date = getItemDate(e, 'event');
                    const isCancelled = e.status === 'cancelled' || e.status === 'completed';
                    // Only show events that are between day after tomorrow and 7 days from now
                    return date && date >= dayAfterTomorrow && date <= nextWeeks && !isCancelled;
                  });

                const upcomingTasks = tasks
                  .filter(t => t.status !== 'completed')
                  .map(t => ({ ...t, itemType: 'task' }))
                  .filter(t => {
                    const date = getItemDate(t, 'task');
                    // Only show tasks that are between day after tomorrow and 7 days from now
                    return date && date >= dayAfterTomorrow && date <= nextWeeks;
                  });

                const allUpcoming = [...upcomingEvents, ...upcomingTasks].sort((a, b) => {
                  const dateA = getItemDate(a, a.itemType);
                  const dateB = getItemDate(b, b.itemType);
                  return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
                });

                if (allUpcoming.length === 0) {
                  return (
                    <div className="text-sm text-text-secondary">
                      No upcoming tasks or events in the next week.
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

                  if (!isEvent) {
                    // Make upcoming tasks draggable too if needed, or just display them
                    // For now, let's make them draggable so you can drag from upcoming to today/tomorrow
                    return (
                      <DraggableTaskRow
                        key={`task-${item.id}`}
                        task={item}
                        onToggle={() => onToggleComplete(item)}
                        onEdit={() => onEditTask(item)}
                        onDelete={() => onDeleteTask(item.id)}
                        onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(item.id) : undefined}
                      />
                    );
                  }

                  return (
                    <div key={`event-${item.id}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-neu-lg transition-shadow duration-200 hover:-translate-y-0.5">
                      <span className={`h-2 w-2 rounded-full flex-shrink-0 bg-accent`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-text-primary truncate">{title}</div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                          <span className="uppercase tracking-wider">Event</span>
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

        {/* Today section - order-1 on mobile, order-2 on desktop */}
        <div className="space-y-4 lg:col-span-1 order-1 lg:order-2">
          <DroppableSection id="today" title="Today" maxHeight="max-h-[480px]" scrollable={true}>
            {today.length === 0 && todayEvents.length === 0 && <div className="text-sm text-text-secondary">No tasks for today.</div>}
            {todayEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
            {today.map(t => <DraggableTaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </DroppableSection>
        </div>

        {/* Tomorrow and Overdue section - order-2/3 on mobile, order-3 on desktop */}
        <div className="space-y-4 lg:col-span-1 order-2 lg:order-3">
          {/* Tomorrow section */}
          <DroppableSection id="tomorrow" title="Tomorrow" maxHeight="max-h-[228px]" scrollable={true}>
            {tomorrow.length === 0 && tomorrowEvents.length === 0 && <div className="text-sm text-text-secondary">Nothing yet.</div>}
            {tomorrowEvents.map((e: any) => <EventRow key={e.id} event={e} onToggle={() => onToggleEvent(e)} />)}
            {tomorrow.map(t => <DraggableTaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </DroppableSection>

          {/* Overdue section - shown below tomorrow on both mobile and desktop */}
          <DroppableSection id="overdue" title="Overdue" maxHeight="max-h-[228px]" scrollable={true}>
            {overdue.length === 0 && <div className="text-sm text-text-secondary">All clear.</div>}
            {overdue.map(t => <DraggableTaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </DroppableSection>
        </div>

        {/* Someday section - order-5 on mobile, last on desktop */}
        <div className="lg:col-span-3 order-5 lg:order-last">
          <DroppableSection id="someday" title="Someday" maxHeight="max-h-[670px]" scrollable={true}>
            {someday.length === 0 && <div className="text-sm text-text-secondary">No backlog items.</div>}
            {someday.map(t => <DraggableTaskRow key={t.id} task={t} onToggle={() => onToggleComplete(t)} onEdit={() => onEditTask(t)} onDelete={() => onDeleteTask(t.id)} onConvertToSchedule={onConvertToSchedule ? () => onConvertToSchedule(t.id) : undefined} />)}
          </DroppableSection>
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-card-hover border-2 border-brand opacity-90">
            <div className="font-semibold text-text-primary">{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PlannerDashboard;
