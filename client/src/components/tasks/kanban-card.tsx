"use client";

import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDate, isPastDue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { PriorityBadge } from "./task-badges";

interface KanbanCardProps {
  task: Task;
  isDragging?: boolean;
}

/**
 * A single task rendered as a board card. Purely presentational — the column
 * wraps it in a Draggable and owns the drag wiring.
 */
export function KanbanCard({ task, isDragging }: KanbanCardProps) {
  const done = task.status === "done";
  const overdue = !done && isPastDue(task.due_date);
  const shown = task.tags.slice(0, 2);
  const extra = task.tags.length - shown.length;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 shadow-sm transition-shadow",
        "hover:border-foreground/20 hover:shadow-md",
        isDragging && "border-primary/40 shadow-lg ring-1 ring-primary/30",
      )}
    >
      <p
        className={cn(
          "text-sm font-medium leading-snug line-clamp-2",
          done && "text-muted-foreground line-through",
        )}
        title={task.title}
      >
        {task.title}
      </p>

      {task.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {shown.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="font-normal">
              {tag.name}
            </Badge>
          ))}
          {extra > 0 && (
            <Badge variant="secondary" className="font-normal">
              +{extra}
            </Badge>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              overdue ? "font-medium text-destructive" : "text-muted-foreground",
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </div>
  );
}
