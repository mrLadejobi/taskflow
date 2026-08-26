"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ListTodo, Loader2, Trash2, X } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { PaginationControls } from "@/components/pagination-controls";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  useBulkDeleteTasks,
  useBulkUpdateStatus,
  useCompleteTask,
  useDeleteTask,
  useMyTasks,
  useProjectTasks,
  useReopenTask,
} from "@/lib/hooks/use-tasks";
import { STATUS_LABELS } from "@/lib/labels";
import { TASK_STATUSES } from "@/lib/types";
import type { Task, TaskListParams, TaskPriority, TaskStatus } from "@/lib/types";
import { TaskFiltersBar } from "./task-filters-bar";
import { TaskFormDialog } from "./task-form-dialog";
import { TaskTable } from "./task-table";

interface TaskTableViewProps {
  /** When set, lists that project's tasks; otherwise lists the user's tasks. */
  projectId?: number;
  /** Opens the parent's create dialog (project view only). */
  onCreate?: () => void;
  /** Opens the task detail modal (added in a later feature). */
  onOpenTask?: (task: Task) => void;
}

const DEFAULT_SORT = "-created_at";

/** Full task list experience: filters, sortable table, bulk actions, paging. */
export function TaskTableView({
  projectId,
  onCreate,
  onOpenTask,
}: TaskTableViewProps) {
  const isProject = projectId != null;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [status, setStatus] = useState<TaskStatus>();
  const [priority, setPriority] = useState<TaskPriority>();
  const [overdue, setOverdue] = useState(false);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const params: TaskListParams = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      status,
      priority,
      overdue: overdue || undefined,
      sort,
      limit,
      offset,
    }),
    [debouncedSearch, status, priority, overdue, sort, limit, offset],
  );

  const projectQuery = useProjectTasks(projectId ?? 0, params);
  const myQuery = useMyTasks(params, !isProject);
  const { data, isLoading, isError, refetch, isFetching } = isProject
    ? projectQuery
    : myQuery;

  const tasks = data?.items ?? [];
  const total = data?.total ?? 0;

  const hasActiveFilters =
    !!debouncedSearch || !!status || !!priority || overdue;

  // Reset selection whenever the underlying query changes.
  useEffect(() => {
    setSelected(new Set());
  }, [params]);

  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const deleteTask = useDeleteTask();
  const bulkStatus = useBulkUpdateStatus();
  const bulkDelete = useBulkDeleteTasks();

  const pageIds = tasks.map((t) => t.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id));

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (pageIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...pageIds]);
    });
  }

  function changeSort(field: string) {
    setOffset(0);
    setSort((prev) => (prev === field ? `-${field}` : prev === `-${field}` ? field : field));
  }

  function clearFilters() {
    setSearch("");
    setStatus(undefined);
    setPriority(undefined);
    setOverdue(false);
    setOffset(0);
  }

  async function handleComplete(task: Task) {
    try {
      await completeTask.mutateAsync(task.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't complete task"));
    }
  }

  async function handleReopen(task: Task) {
    try {
      await reopenTask.mutateAsync(task.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't reopen task"));
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    try {
      await deleteTask.mutateAsync(pendingDelete.id);
      toast.success("Task deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't delete task"));
      throw error;
    }
  }

  async function applyBulkStatus(next: TaskStatus) {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      const res = await bulkStatus.mutateAsync({ ids, status: next });
      toast.success(`Updated ${res.affected} task${res.affected === 1 ? "" : "s"}`);
      setSelected(new Set());
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't update tasks"));
    }
  }

  async function handleBulkDelete() {
    const ids = [...selected];
    if (ids.length === 0) return;
    try {
      const res = await bulkDelete.mutateAsync(ids);
      toast.success(`Deleted ${res.affected} task${res.affected === 1 ? "" : "s"}`);
      setSelected(new Set());
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't delete tasks"));
      throw error;
    }
  }

  const openTask = onOpenTask ?? setEditTask;

  return (
    <div className="space-y-4">
      <TaskFiltersBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setOffset(0);
        }}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          setOffset(0);
        }}
        priority={priority}
        onPriorityChange={(p) => {
          setPriority(p);
          setOffset(0);
        }}
        overdue={overdue}
        onOverdueChange={(v) => {
          setOverdue(v);
          setOffset(0);
        }}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Set status</span>
            <Select onValueChange={(v) => applyBulkStatus(v as TaskStatus)}>
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setBulkDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-muted-foreground"
            onClick={() => setSelected(new Set())}
          >
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-72 w-full" />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load tasks.
            </p>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <ListTodo className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No tasks match your filters."
                : "No tasks yet."}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : (
              isProject &&
              onCreate && <Button onClick={onCreate}>Create a task</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <TaskTable
            tasks={tasks}
            sort={sort}
            onSortChange={changeSort}
            selectedIds={selected}
            onToggleRow={toggleRow}
            onToggleAll={toggleAll}
            allSelected={allSelected}
            someSelected={someSelected && !allSelected}
            onOpen={openTask}
            onEdit={setEditTask}
            onDelete={setPendingDelete}
            onComplete={handleComplete}
            onReopen={handleReopen}
          />
          <div className="flex items-center justify-between gap-2">
            {isFetching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <div className="ml-auto">
              <PaginationControls
                offset={offset}
                limit={limit}
                total={total}
                onOffsetChange={setOffset}
                onLimitChange={setLimit}
              />
            </div>
          </div>
        </>
      )}

      {editTask && (
        <TaskFormDialog
          open={!!editTask}
          onOpenChange={(o) => !o && setEditTask(null)}
          projectId={editTask.project_id}
          task={editTask}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        title="Delete task?"
        description={
          <>
            <span className="font-medium text-foreground">
              {pendingDelete?.title}
            </span>{" "}
            will be permanently deleted.
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selected.size} task${selected.size === 1 ? "" : "s"}?`}
        description="The selected tasks will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={handleBulkDelete}
      />
    </div>
  );
}
