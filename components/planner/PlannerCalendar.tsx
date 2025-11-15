import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import { DateSelectArg, EventDropArg, EventClickArg } from '@fullcalendar/core';
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
    
    const external = (externalEvents || []).map((e: any) => {
      // Google Tasks (mapped in App.tsx with gtaskId property)
      if (e.gtaskId) {
        return {
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end || e.start,
          allDay: true,
          color: '#f59e0b',
        };
      }
      // Google Calendar Events (with start.dateTime or start.date structure)
      return {
        id: e.id,
        title: e.summary || e.title || 'Event',
        start: e.start?.dateTime || e.start?.date || e.start,
        end: e.end?.dateTime || e.end?.date || e.end,
        color: '#22c55e',
      };
    });

    return [...local, ...external];
  }, [tasks, externalEvents]);

  const handleSelect = (arg: DateSelectArg) => {
    onCreateSlot(arg.startStr, arg.endStr);
  };

  const handleDrop = async (arg: EventDropArg) => {
    const id = String(arg.event.id);
    if (!tasks.find(t=>t.id===id)) return; // ignore external event moves
    await api.updateTask(id, { start: arg.event.start?.toISOString(), end: arg.event.end?.toISOString() });
  };

  const handleResize = async (arg: EventResizeDoneArg) => {
    const id = String(arg.event.id);
    if (!tasks.find(t=>t.id===id)) return;
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
      // External event (Google Calendar or Google Task) - show info only
      const title = arg.event.title || 'Event';
      alert(`"${title}"\n\nThis is a synced event from Google Calendar/Tasks.\nEdit it directly in Google Calendar or Google Tasks.`);
    }
  };

  return (
    <div className="relative bg-card-bg backdrop-blur-xl rounded-xl p-5 shadow-neu-3d hover:shadow-card-hover transition-all duration-300 border border-white/40">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      <div className="relative">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        initialView="dayGridMonth"
        selectable
        selectMirror
        editable
        weekends
        events={events}
        select={handleSelect}
        eventDrop={handleDrop}
        eventResize={handleResize}
        eventClick={handleEventClick}
        datesSet={info => onDatesChange(info.start, info.end)}
        height="auto"
      />
      </div>
    </div>
  );
};

export default PlannerCalendar;
