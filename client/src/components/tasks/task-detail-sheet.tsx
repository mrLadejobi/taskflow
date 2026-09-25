"use client";

import { Calendar, CheckCircle2, MessageSquare, Tag as TagIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PriorityBadge, StatusBadge } from "@/components/tasks/task-badges";
import { SubtaskChecklist } from "@/components/tasks/subtask-checklist";
import { CommentThread } from "@/components/tasks/comment-thread";
import { TaskActivityTimeline } from "@/components/tasks/task-activity-timeline";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { formatDate } from "@/lib/format";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({
  task,
  open,
  onOpenChange,
}: TaskDetailSheetProps) {
  const updateTask = useUpdateTask();

  if (!task) return null;

  const handleStatusChange = (status: TaskStatus) => {
    updateTask.mutate({ id: task.id, input: { status } });
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    updateTask.mutate({ id: task.id, input: { priority } });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-6">
        <SheetHeader className="space-y-3 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {task.due_date && (
              <Badge variant="outline" className="gap-1 text-xs font-normal">
                <Calendar className="h-3 w-3" />
                {formatDate(task.due_date)}
              </Badge>
            )}
          </div>

          <SheetTitle className="text-xl font-bold leading-tight text-foreground">
            {task.title}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pt-5">
          {/* Description */}
          {task.description ? (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </span>
              <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap rounded-lg bg-muted/40 p-3">
                {task.description}
              </p>
            </div>
          ) : (
            <p className="text-xs italic text-muted-foreground">No description provided.</p>
          )}

          {/* Quick controls */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/50 bg-card p-3">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Status</span>
              <Select
                value={task.status}
                onValueChange={(val) => handleStatusChange(val as TaskStatus)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-medium text-muted-foreground">Priority</span>
              <Select
                value={task.priority}
                onValueChange={(val) => handlePriorityChange(val as TaskPriority)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <TagIcon className="h-3 w-3" /> Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((t) => (
                  <Badge key={t.id} variant="secondary" className="text-xs">
                    {t.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tabs for Subtasks, Comments, and Activity */}
          <Tabs defaultValue="checklist" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checklist" className="gap-1.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5" /> Checklist
              </TabsTrigger>
              <TabsTrigger value="discussion" className="gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Discussion
              </TabsTrigger>
              <TabsTrigger value="activity" className="gap-1.5 text-xs">
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="pt-2">
              <SubtaskChecklist taskId={task.id} />
            </TabsContent>

            <TabsContent value="discussion" className="pt-2">
              <CommentThread taskId={task.id} />
            </TabsContent>

            <TabsContent value="activity" className="pt-2">
              <TaskActivityTimeline taskId={task.id} />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
