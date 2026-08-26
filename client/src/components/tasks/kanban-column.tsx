"use client";

import { Draggable, Droppable } from "@hello-pangea/dnd";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";
import { KanbanCard } from "./kanban-card";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

/** A single status column: a droppable list of draggable task cards. */
export function KanbanColumn({ status, tasks }: KanbanColumnProps) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border bg-muted/30">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: STATUS_COLORS[status] }}
        />
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "flex min-h-24 flex-1 flex-col gap-2 p-2 transition-colors",
              snapshot.isDraggingOver && "bg-primary/5",
            )}
          >
            {tasks.map((task, index) => (
              <Draggable
                key={task.id}
                draggableId={String(task.id)}
                index={index}
              >
                {(dragProvided, dragSnapshot) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                  >
                    <KanbanCard task={task} isDragging={dragSnapshot.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                No tasks
              </p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
