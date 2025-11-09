import React, { useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventResizeDoneArg } from '@fullcalendar/interaction';
import { DateSelectArg, EventDropArg } from '@fullcalendar/core';
import { Task } from '../../types';
import * as api from '../../services/api';

interface PlannerCalendarProps {
  tasks: Task[];
  externalEvents: any[];
  onCreateSlot: (start: string, end: string) => void;
  onDatesChange: (start: Date, end: Date) => void;
}

const PlannerCalendar: React.FC<PlannerCalendarProps> = ({ tasks, externalEvents, onCreateSlot, onDatesChange }) => {
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

  return (
    <div className="bg-surface/70 border border-border-shadow rounded-xl p-3 shadow-neu-sm">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        initialView="timeGridWeek"
        selectable
        selectMirror
        editable
        weekends
        events={events}
        select={handleSelect}
        eventDrop={handleDrop}
        eventResize={handleResize}
        datesSet={info => onDatesChange(info.start, info.end)}
        height="auto"
      />
    </div>
  );
};

export default PlannerCalendar;
