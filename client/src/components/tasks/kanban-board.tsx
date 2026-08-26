"use client";

import { useEffect, useState } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getErrorMessage } from "@/lib/api/client";
import { useProjectTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import { TASK_STATUSES } from "@/lib/types";
import type { Task, TaskStatus } from "@/lib/types";
import { KanbanColumn } from "./kanban-column";

interface KanbanBoardProps {
  projectId: number;
}

/** Fetch enough tasks to fill the board without paging through columns. */
const BOARD_PARAMS = { limit: 100, sort: "-created_at" } as const;

type Board = Record<TaskStatus, Task[]>;

function emptyBoard(): Board {
  return { todo: [], in_progress: [], review: [], done: [] };
}

function groupByStatus(items: Task[]): Board {
  const board = emptyBoard();
  for (const task of items) board[task.status].push(task);
  return board;
}

/**
 * Drag-and-drop board grouping a project's tasks by status. Moving a card to
 * another column optimistically updates the UI and persists the new status;
 * within-column order is server-defined and not rearrangeable.
 */
export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { data, isLoading, isError, refetch, isFetching } = useProjectTasks(
    projectId,
    BOARD_PARAMS,
  );
  const updateTask = useUpdateTask();

  const [board, setBoard] = useState<Board>(emptyBoard);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Keep local board state in sync with the authoritative server data.
  useEffect(() => {
    if (data) setBoard(groupByStatus(data.items));
  }, [data]);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    const from = source.droppableId as TaskStatus;
    const to = destination.droppableId as TaskStatus;
    if (from === to) return; // cross-column moves only

    const taskId = Number(draggableId);

    setBoard((prev) => {
      const moving = prev[from].find((t) => t.id === taskId);
      if (!moving) return prev;
      const next: Board = { ...prev };
      next[from] = prev[from].filter((t) => t.id !== taskId);
      const destList = [...prev[to]];
      destList.splice(destination.index, 0, { ...moving, status: to });
      next[to] = destList;
      return next;
    });

    updateTask.mutate(
      { id: taskId, input: { status: to } },
      {
        onError: (error) => {
          toast.error(getErrorMessage(error, "Couldn't move task"));
          // Revert to the last known server state.
          if (data) setBoard(groupByStatus(data.items));
        },
      },
    );
  }

  if (!mounted || isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((status) => (
          <Skeleton key={status} className="h-72 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Couldn&apos;t load the board.</p>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const total = data?.total ?? 0;
  const loaded = data?.items.length ?? 0;

  return (
    <div className="space-y-3">
      {total > loaded && (
        <p className="text-xs text-muted-foreground">
          Showing the {loaded} most recent of {total} tasks. Switch to the Table
          view to see them all.
        </p>
      )}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((status) => (
            <KanbanColumn key={status} status={status} tasks={board[status]} />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
