import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import { DateSelectArg, EventDropArg, EventClickArg, DateClickArg } from '@fullcalendar/core';
import { Task } from '../../types';
import * as api from '../../services/api';

interface PlannerCalendarProps {
  tasks: Task[];
  externalEvents: any[];
  onCreateSlot: (start: string, end: string) => void;
  onDatesChange: (start: Date, end: Date) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const PlannerCalendar: React.FC<PlannerCalendarProps> = ({ tasks, externalEvents, onCreateSlot, onDatesChange, onEditTask, onDeleteTask }) => {
  const events = useMemo(() => {
    const local = tasks
      .filter(t => t.start && t.end)
      .map(t => ({ id: t.id, title: t.title, start: t.start!, end: t.end!, backgroundColor: t.color || undefined }));

    return local;
  }, [tasks]);

  const handleSelect = (arg: DateSelectArg) => {
    console.log('[PlannerCalendar] Date range selected:', { start: arg.startStr, end: arg.endStr });
    onCreateSlot(arg.startStr, arg.endStr);
  };

  const handleDateClick = (arg: DateClickArg) => {
    console.log('[PlannerCalendar] Date clicked (mobile-friendly):', arg.dateStr);
    // For single date click, use the same date for start and end
    // This creates a single-day event/task
    const endDate = new Date(arg.date);
    endDate.setDate(endDate.getDate() + 1); // End date is next day for all-day events
    const endStr = endDate.toISOString().split('T')[0];
    onCreateSlot(arg.dateStr, endStr);
  };

  const handleDrop = async (arg: EventDropArg) => {
    const id = String(arg.event.id);
    if (!tasks.find(t => t.id === id)) return; // ignore external event moves
    await api.updateTask(id, { start: arg.event.start?.toISOString(), end: arg.event.end?.toISOString() });
  };

  const handleResize = async (arg: EventResizeDoneArg) => {
    const id = String(arg.event.id);
    if (!tasks.find(t => t.id === id)) return;
    await api.updateTask(id, { start: arg.event.start?.toISOString(), end: arg.event.end?.toISOString() });
  };

  const handleEventClick = (arg: EventClickArg) => {
    const id = String(arg.event.id);
    const task = tasks.find(t => t.id === id);

    if (task) {
      // Local task - allow edit/delete
      const action = confirm(`Edit or Delete "${task.title}"?\n\nOK = Edit\nCancel = Delete`);
      if (action) {
        onEditTask(task);
      } else {
        if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
          onDeleteTask(task.id);
        }
      }
    } else {
      // Should not happen for local tasks
    }
  };

  return (
    <div className="bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300">
      <div>
        <style>{`
          .fc-button-primary {
            background-color: var(--color-button-primary) !important;
            border-color: var(--color-button-primary) !important;
            color: var(--color-button-text) !important;
            text-transform: capitalize;
            font-weight: 600;
            border-radius: 0.5rem !important;
            padding: 0.4rem 1rem !important;
            transition: all 0.2s;
            box-shadow: var(--color-shadow-elevation-sm);
          }
          .fc-button-primary:hover {
            background-color: var(--color-button-primary-hover) !important;
            border-color: var(--color-button-primary-hover) !important;
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: var(--color-shadow-elevation-md);
          }
          .fc-button-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .fc-button-active {
            background-color: var(--color-accent) !important;
            border-color: var(--color-accent) !important;
          }
          .fc-toolbar-title {
            font-size: 1.25rem !important;
            font-weight: 700;
            color: var(--color-text-primary);
          }
          .fc-daygrid-event {
            background: transparent !important;
            border: none !important;
            margin-top: 2px !important;
          }
          .fc-daygrid-day-number {
            color: var(--color-text-muted);
            font-weight: 500;
          }
          .fc-col-header-cell-cushion {
            color: var(--color-text-primary);
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.75rem;
            letter-spacing: 0.05em;
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: var(--color-border-light) !important;
          }
          .fc-day-today {
            background-color: transparent !important;
            border: 2px solid var(--color-brand) !important;
            position: relative;
          }
          .fc-day-today::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--color-brand);
            opacity: 0.15;
            pointer-events: none;
            z-index: 0;
          }
          .fc-day-today .fc-daygrid-day-number {
            font-weight: 800;
            color: var(--color-brand);
            font-size: 1.1em;
            position: relative;
            z-index: 1;
          }
        `}</style>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{ left: 'prev,next', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
          initialView="dayGridMonth"
          selectable
          selectMirror
          editable
          weekends
          events={events}
          select={handleSelect}
          dateClick={handleDateClick}
          eventDrop={handleDrop}
          eventResize={handleResize}
          eventClick={handleEventClick}
          datesSet={info => onDatesChange(info.start, info.end)}
          height="auto"
          longPressDelay={500}
          selectLongPressDelay={500}
          eventContent={(eventInfo) => {
            const color = eventInfo.event.backgroundColor || 'var(--color-accent)';
            return (
              <div className="flex items-center px-2 py-1 rounded-md w-full overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                style={{
                  backgroundColor: `${color}20`,
                  borderLeft: `3px solid ${color}`,
                  marginTop: '2px'
                }}>
                <span className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {eventInfo.event.title}
                </span>
              </div>
            );
          }}
        />
      </div>
    </div>
  );
};

export default PlannerCalendar;
