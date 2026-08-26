"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/types";
import type { TaskPriority, TaskStatus } from "@/lib/types";

const ALL = "all";

interface TaskFiltersBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status?: TaskStatus;
  onStatusChange: (status?: TaskStatus) => void;
  priority?: TaskPriority;
  onPriorityChange: (priority?: TaskPriority) => void;
  overdue: boolean;
  onOverdueChange: (overdue: boolean) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

/** Search + status/priority/overdue filters for a task list. */
export function TaskFiltersBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  overdue,
  onOverdueChange,
  onClear,
  hasActiveFilters,
}: TaskFiltersBarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks…"
          className="pl-9"
        />
      </div>

      <Select
        value={status ?? ALL}
        onValueChange={(v) =>
          onStatusChange(v === ALL ? undefined : (v as TaskStatus))
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={priority ?? ALL}
        onValueChange={(v) =>
          onPriorityChange(v === ALL ? undefined : (v as TaskPriority))
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All priorities</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={overdue ? "default" : "outline"}
        onClick={() => onOverdueChange(!overdue)}
        className={cn(!overdue && "text-muted-foreground")}
      >
        Overdue
      </Button>

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="text-muted-foreground"
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
}
