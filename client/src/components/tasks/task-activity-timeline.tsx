"use client";

import { Clock, History } from "lucide-react";
import { useTaskActivity } from "@/lib/hooks/use-activity";
import { formatDate } from "@/lib/format";

interface TaskActivityTimelineProps {
  taskId: number;
}

export function TaskActivityTimeline({ taskId }: TaskActivityTimelineProps) {
  const { data: activities = [], isLoading } = useTaskActivity(taskId);

  if (isLoading) {
    return <div className="py-4 text-xs text-muted-foreground">Loading activity history...</div>;
  }

  const formatAction = (action: string) => {
    switch (action) {
      case "comment_added":
        return "added a comment";
      case "subtask_created":
        return "created a subtask";
      case "subtask_toggled":
        return "updated a subtask";
      case "status_changed":
        return "updated task status";
      default:
        return action.replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative space-y-4 before:absolute before:bottom-0 before:left-3 before:top-2 before:w-[1px] before:bg-border/60">
        {activities.map((item) => (
          <div key={item.id} className="relative flex items-start gap-3 pl-1">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border bg-background">
              <Clock className="h-2.5 w-2.5 text-muted-foreground" />
            </div>

            <div className="flex-1 space-y-0.5 text-xs">
              <p className="text-foreground">
                <span className="font-semibold">
                  {item.user?.full_name || item.user?.email || "User"}
                </span>{" "}
                <span className="text-muted-foreground">{formatAction(item.action)}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                {formatDate(item.created_at)}
              </p>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            <History className="mx-auto mb-2 h-6 w-6 opacity-30" />
            No activity logged yet.
          </div>
        )}
      </div>
    </div>
  );
}
