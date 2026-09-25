import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isDueSoon, isPastDue, formatDate } from "@/lib/format";

interface OverdueBadgeProps {
  dueDate?: string | null;
  completed?: boolean;
  className?: string;
}

export function OverdueBadge({
  dueDate,
  completed = false,
  className,
}: OverdueBadgeProps) {
  if (!dueDate || completed) return null;

  if (isPastDue(dueDate)) {
    return (
      <Badge
        variant="destructive"
        className={`gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${className || ""}`}
      >
        <AlertTriangle className="h-3 w-3" />
        <span>Overdue ({formatDate(dueDate)})</span>
      </Badge>
    );
  }

  if (isDueSoon(dueDate)) {
    return (
      <Badge
        variant="outline"
        className={`gap-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10 ${className || ""}`}
      >
        <Clock className="h-3 w-3" />
        <span>Due soon ({formatDate(dueDate)})</span>
      </Badge>
    );
  }

  return null;
}
