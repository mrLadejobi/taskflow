"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  SquareCheckBig,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, isPastDue } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "./task-badges";

interface TaskTableProps {
  tasks: Task[];
  sort: string;
  onSortChange: (field: string) => void;
  selectedIds: Set<number>;
  onToggleRow: (id: number) => void;
  onToggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
  onOpen: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onComplete: (task: Task) => void;
  onReopen: (task: Task) => void;
}

/** The rich, sortable, selectable task table. Purely presentational. */
export function TaskTable({
  tasks,
  sort,
  onSortChange,
  selectedIds,
  onToggleRow,
  onToggleAll,
  allSelected,
  someSelected,
  onOpen,
  onEdit,
  onDelete,
  onComplete,
  onReopen,
}: TaskTableProps) {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">
              <Checkbox
                checked={
                  allSelected ? true : someSelected ? "indeterminate" : false
                }
                onCheckedChange={onToggleAll}
                aria-label="Select all tasks"
              />
            </TableHead>
            <SortableHead
              field="title"
              label="Title"
              sort={sort}
              onSortChange={onSortChange}
            />
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead className="hidden md:table-cell">Tags</TableHead>
            <SortableHead
              field="due_date"
              label="Due"
              sort={sort}
              onSortChange={onSortChange}
              className="hidden sm:table-cell"
            />
            <SortableHead
              field="created_at"
              label="Created"
              sort={sort}
              onSortChange={onSortChange}
              className="hidden lg:table-cell"
            />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const done = task.status === "done";
            const overdue = !done && isPastDue(task.due_date);
            const selected = selectedIds.has(task.id);
            return (
              <TableRow
                key={task.id}
                data-state={selected ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => onToggleRow(task.id)}
                    aria-label={`Select ${task.title}`}
                  />
                </TableCell>
                <TableCell className="max-w-[22rem]">
                  <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className="block max-w-full truncate text-left font-medium hover:underline"
                    title={task.title}
                  >
                    <span className={cn(done && "text-muted-foreground line-through")}>
                      {task.title}
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <StatusBadge status={task.status} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={task.priority} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <TagList tags={task.tags} />
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <span
                    className={cn(
                      "text-sm",
                      overdue
                        ? "font-medium text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    {formatDate(task.due_date)}
                  </span>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                  {formatDate(task.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`Actions for ${task.title}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => onOpen(task)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Open
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => onEdit(task)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      {done ? (
                        <DropdownMenuItem onSelect={() => onReopen(task)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Reopen
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => onComplete(task)}>
                          <SquareCheckBig className="mr-2 h-4 w-4" />
                          Mark done
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => onDelete(task)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function SortableHead({
  field,
  label,
  sort,
  onSortChange,
  className,
}: {
  field: string;
  label: string;
  sort: string;
  onSortChange: (field: string) => void;
  className?: string;
}) {
  const active = sort === field || sort === `-${field}`;
  const desc = sort === `-${field}`;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSortChange(field)}
        className="-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground"
      >
        {label}
        {!active ? (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        ) : desc ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" />
        )}
      </button>
    </TableHead>
  );
}

function TagList({ tags }: { tags: Task["tags"] }) {
  if (tags.length === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  const shown = tags.slice(0, 2);
  const extra = tags.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
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
  );
}
