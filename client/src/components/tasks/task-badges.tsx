import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PRIORITY_BADGE_CLASSES,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/labels";
import type { TaskPriority, TaskStatus } from "@/lib/types";

/** Status pill: a colored dot plus the human label. */
export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", className)}>
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: STATUS_COLORS[status] }}
      />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

/** Priority pill, tinted by severity. */
export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", PRIORITY_BADGE_CLASSES[priority], className)}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
