import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';

interface PlannerBoardProps {
  tasks: Task[];
  onMove: (id: string, status: Task['status']) => void;
}

const Column: React.FC<{ title: string; children: React.ReactNode }>=({title,children})=> (
  <div className="bg-surface/70 border border-border-shadow rounded-xl p-3 shadow-neu-sm min-h-[300px]">
    <div className="text-sm font-semibold tracking-wide uppercase text-text-secondary mb-2">{title}</div>
    {children}
  </div>
);

const SortableItem: React.FC<{ id: string; title: string }>=({ id, title })=>{
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="px-3 py-2 rounded-md bg-surface hover:bg-surface/80 border border-border-shadow mb-2 cursor-grab">
      <div className="text-sm">{title}</div>
    </div>
  );
};

const PlannerBoard: React.FC<PlannerBoardProps> = ({ tasks, onMove }) => {
  const columns: { key: Task['status']; title: string }[] = [
    { key: 'new', title: 'New' },
    { key: 'scheduled', title: 'Scheduled' },
    { key: 'in_progress', title: 'In progress' },
    { key: 'completed', title: 'Completed' },
  ];

  const itemsByCol = useMemo(() => {
    const map: Record<string, Task[]> = { new: [], scheduled: [], in_progress: [], completed: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  const [order, setOrder] = useState<Record<string, string[]>>(() => Object.fromEntries(Object.entries(itemsByCol).map(([k, arr]) => [k, arr.map(t=>t.id)])) as any);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const sourceCol = Object.keys(order).find(col => order[col].includes(String(active.id)));
    const destCol = String(over.id).startsWith('col:') ? String(over.id).slice(4) : sourceCol;
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
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => (
          <div key={col.key} id={`col:${col.key}`}>
            <Column title={col.title}>
              <SortableContext items={(order[col.key] as string[] || []) as any} strategy={verticalListSortingStrategy}>
                {((order[col.key] as string[] ) || []).map(id => {
                  const t = tasks.find(x=>x.id===id);
                  if (!t) return null;
                  return <SortableItem key={id} id={id} title={t.title} />
                })}
              </SortableContext>
            </Column>
          </div>
        ))}
      </div>
    </DndContext>
  );
};

export default PlannerBoard;
