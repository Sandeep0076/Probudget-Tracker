import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';

interface PlannerBoardProps {
  tasks: Task[];
  onMove: (id: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const Column: React.FC<{ title: string; children: React.ReactNode }>=({title,children})=> (
  <div className="bg-card-bg backdrop-blur-xl rounded-xl p-4 shadow-neu-3d hover:shadow-card-hover transition-shadow duration-300 min-h-[300px]">
    <div className="text-sm font-semibold tracking-wide uppercase text-text-dark mb-3">{title}</div>
    <div>{children}</div>
  </div>
);

const SortableItem: React.FC<{
  id: string;
  title: string;
  onEdit: () => void;
  onDelete: () => void;
}>=({ id, title, onEdit, onDelete })=>{
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} className="group px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-neu-sm hover:shadow-card-hover hover:-translate-y-1 mb-3 transition-all duration-200">
      <div className="flex items-center justify-between gap-2">
        <div {...attributes} {...listeners} className="flex-1 cursor-grab active:cursor-grabbing">
          <div className="text-sm text-text-primary font-semibold">{title}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('[PlannerBoard] Edit button clicked for task:', id, title);
              onEdit();
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-border-highlight rounded-lg transition-opacity"
            title="Edit"
          >
            <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('[PlannerBoard] Delete button clicked for task:', id, title);
              onDelete();
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-danger/10 rounded-lg transition-opacity"
            title="Delete"
          >
            <svg className="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const PlannerBoard: React.FC<PlannerBoardProps> = ({ tasks, onMove, onEdit, onDelete }) => {
  console.log('[PlannerBoard] Rendering with tasks:', tasks.length);
  
  const topRowColumns: { key: Task['status']; title: string }[] = [
    { key: 'scheduled', title: 'Scheduled' },
    { key: 'in_progress', title: 'In Progress' },
  ];

  const bottomRowColumns: { key: Task['status']; title: string }[] = [
    { key: 'backlog', title: 'Backlogs' },
    { key: 'completed', title: 'Completed' },
  ];

  const itemsByCol = useMemo(() => {
    const map: Record<string, Task[]> = { scheduled: [], in_progress: [], completed: [], backlog: [] };
    for (const t of tasks) {
      // Move 'new' status tasks to 'backlog'
      if (t.status === 'new') {
        console.log('[PlannerBoard] Moving task from "new" to "backlog":', t.title);
        map['backlog'].push(t);
      } else if (map[t.status]) {
        map[t.status].push(t);
      } else {
        console.warn('[PlannerBoard] Unknown task status:', t.status, 'for task:', t.title);
      }
    }
    console.log('[PlannerBoard] Tasks by column:', Object.entries(map).map(([k, v]) => `${k}: ${v.length}`).join(', '));
    return map;
  }, [tasks]);

  const [order, setOrder] = useState<Record<string, string[]>>(() => {
    const initialOrder: Record<string, string[]> = {};
    Object.entries(itemsByCol).forEach(([k, arr]) => {
      initialOrder[k] = (arr as Task[]).map(t => t.id);
    });
    return initialOrder;
  });

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    console.log('[PlannerBoard] Drag end - active:', active.id, 'over:', over?.id);
    if (!over) return;
    const sourceCol = Object.keys(order).find(col => order[col].includes(String(active.id)));
    const destCol = String(over.id).startsWith('col:') ? String(over.id).slice(4) : sourceCol;
    console.log('[PlannerBoard] Moving from', sourceCol, 'to', destCol);
    if (!sourceCol || !destCol) return;

    if (sourceCol === destCol) {
      const idxFrom = order[sourceCol].indexOf(String(active.id));
      const idxTo = order[destCol].indexOf(String(over.id));
      const updated = arrayMove(order[sourceCol], idxFrom, idxTo);
      setOrder({ ...order, [sourceCol]: updated });
    } else {
      setOrder({
        ...order,
        [sourceCol]: order[sourceCol].filter(id => id !== active.id),
        [destCol]: [active.id as string, ...order[destCol]],
      });
      onMove(String(active.id), destCol as Task['status']);
      console.log('[PlannerBoard] Task moved to new status:', destCol);
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* Top Row: SCHEDULED, IN PROGRESS (doubled width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {topRowColumns.map(col => (
            <div key={col.key} id={`col:${col.key}`} className={col.key === 'in_progress' ? 'md:col-span-2' : ''}>
              <Column title={col.title}>
                <SortableContext items={(order[col.key] as string[] || []) as any} strategy={verticalListSortingStrategy}>
                  {((order[col.key] as string[] ) || []).map(id => {
                    const t = tasks.find(x=>x.id===id);
                    if (!t) return null;
                    return <SortableItem
                      key={id}
                      id={id}
                      title={t.title}
                      onEdit={() => onEdit(t)}
                      onDelete={() => onDelete(t.id)}
                    />
                  })}
                </SortableContext>
              </Column>
            </div>
          ))}
        </div>

        {/* Bottom Row: BACKLOG, COMPLETED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bottomRowColumns.map(col => (
            <div key={col.key} id={`col:${col.key}`}>
              <Column title={col.title}>
                <SortableContext items={(order[col.key] as string[] || []) as any} strategy={verticalListSortingStrategy}>
                  {((order[col.key] as string[] ) || []).map(id => {
                    const t = tasks.find(x=>x.id===id);
                    if (!t) return null;
                    return <SortableItem
                      key={id}
                      id={id}
                      title={t.title}
                      onEdit={() => onEdit(t)}
                      onDelete={() => onDelete(t.id)}
                    />
                  })}
                </SortableContext>
              </Column>
            </div>
          ))}
        </div>
      </div>
    </DndContext>
  );
};

export default PlannerBoard;
