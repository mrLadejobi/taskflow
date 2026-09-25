import { CheckCircle2, CircleDot, MessageSquare, Tag, User } from "lucide-react";
import type { ActivityLog } from "@/lib/types";
import { formatRelative } from "@/lib/format";

interface TaskActivityTimelineProps {
  logs: ActivityLog[];
  className?: string;
}

export function TaskActivityTimeline({ logs, className }: TaskActivityTimelineProps) {
  if (logs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground py-4 text-center">
        No recent activity recorded for this item.
      </p>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case "completed":
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case "commented":
        return <MessageSquare className="h-3.5 w-3.5 text-blue-500" />;
      case "tagged":
        return <Tag className="h-3.5 w-3.5 text-purple-500" />;
      case "assigned":
        return <User className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className={className}>
      <ol className="relative border-l border-border/60 ml-2 space-y-4 py-2">
        {logs.map((log) => (
          <li key={log.id} className="ml-4">
            <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-background ring-4 ring-background">
              {getActionIcon(log.action)}
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-medium text-foreground">
                {log.description || `${log.action} task`}
              </p>
              <time className="text-[10px] text-muted-foreground shrink-0">
                {formatRelative(log.created_at)}
              </time>
            </div>
            {log.details && Object.keys(log.details).length > 0 && (
              <pre className="mt-1 text-[11px] text-muted-foreground bg-muted/40 p-1.5 rounded font-mono overflow-x-auto">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
