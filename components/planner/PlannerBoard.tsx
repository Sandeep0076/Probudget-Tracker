import React, { useMemo, useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, useDroppable, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';

interface PlannerBoardProps {
  tasks: Task[];
  onMove: (id: string, status: Task['status']) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const Column: React.FC<{
  id: string;
  title: string;
  children: React.ReactNode;
}>=({id, title, children})=> {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      className={`bg-card-bg backdrop-blur-xl rounded-xl p-4 shadow-neu-3d hover:shadow-card-hover transition-all duration-300 min-h-[300px] ${
        isOver ? 'ring-2 ring-brand shadow-[0_0_20px_var(--color-brand)]' : ''
      }`}
    >
      <div className="text-sm font-semibold tracking-wide uppercase text-text-dark mb-3">{title}</div>
      <div className="min-h-[200px]">{children}</div>
    </div>
  );
};

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

  const [order, setOrder] = useState<Record<string, string[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update order when tasks change
  useEffect(() => {
    const newOrder: Record<string, string[]> = {};
    Object.entries(itemsByCol).forEach(([k, arr]) => {
      newOrder[k] = (arr as Task[]).map(t => t.id);
    });
    setOrder(newOrder);
    console.log('[PlannerBoard] Order updated:', Object.entries(newOrder).map(([k, v]) => `${k}: ${v.length}`).join(', '));
  }, [itemsByCol]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
    console.log('[PlannerBoard] Drag started - task:', event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    console.log('[PlannerBoard] Drag over - active:', activeId, 'over:', overId);

    // Find which column the active item is in
    const activeColumn = Object.keys(order).find(col => order[col].includes(activeId));
    
    // Determine the target column
    let overColumn: string | undefined;
    
    // Check if we're over a column directly
    if (['scheduled', 'in_progress', 'backlog', 'completed'].includes(overId)) {
      overColumn = overId;
    } else {
      // We're over an item, find which column it's in
      overColumn = Object.keys(order).find(col => order[col].includes(overId));
    }

    if (!activeColumn || !overColumn) return;

    console.log('[PlannerBoard] Drag over - from column:', activeColumn, 'to column:', overColumn);

    // If moving to a different column
    if (activeColumn !== overColumn) {
      setOrder(prev => {
        const activeItems = [...prev[activeColumn]];
        const overItems = [...prev[overColumn]];
        
        // Remove from source
        const activeIndex = activeItems.indexOf(activeId);
        activeItems.splice(activeIndex, 1);
        
        // Add to destination at the top
        overItems.unshift(activeId);
        
        return {
          ...prev,
          [activeColumn]: activeItems,
          [overColumn]: overItems,
        };
      });
    }
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    console.log('[PlannerBoard] Drag end - active:', active.id, 'over:', over?.id);
    
    setActiveId(null);
    
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    
    const sourceCol = Object.keys(order).find(col => order[col].includes(activeId));
    
    // Determine destination column
    let destCol: string | undefined;
    if (['scheduled', 'in_progress', 'backlog', 'completed'].includes(overId)) {
      destCol = overId;
    } else {
      destCol = Object.keys(order).find(col => order[col].includes(overId));
    }
    
    console.log('[PlannerBoard] Final drop - from:', sourceCol, 'to:', destCol);
    
    if (!sourceCol || !destCol) return;

    // If moved to a different column, update the backend
    if (sourceCol !== destCol) {
      console.log('[PlannerBoard] Task moved to new status:', destCol, 'calling onMove');
      onMove(activeId, destCol as Task['status']);
    } else if (sourceCol === destCol) {
      // Reordering within the same column
      const items = order[sourceCol];
      const oldIndex = items.indexOf(activeId);
      const newIndex = items.indexOf(overId);
      
      if (oldIndex !== newIndex) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        setOrder(prev => ({
          ...prev,
          [sourceCol]: reordered,
        }));
        console.log('[PlannerBoard] Reordered within column:', sourceCol);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    console.log('[PlannerBoard] Drag cancelled');
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-4">
        {/* Top Row: SCHEDULED, IN PROGRESS (doubled width) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {topRowColumns.map(col => (
            <div key={col.key} className={col.key === 'in_progress' ? 'md:col-span-2' : ''}>
              <Column id={col.key} title={col.title}>
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
            <div key={col.key}>
              <Column id={col.key} title={col.title}>
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
      
      <DragOverlay>
        {activeTask ? (
          <div className="px-4 py-3 rounded-xl bg-card-bg backdrop-blur-sm shadow-card-hover border-2 border-brand opacity-90">
            <div className="text-sm text-text-primary font-semibold">{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default PlannerBoard;
