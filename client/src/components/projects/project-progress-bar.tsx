import { cn } from "@/lib/utils";

interface ProjectProgressBarProps {
  total: number;
  completed: number;
  inProgress?: number;
  className?: string;
  showLabels?: boolean;
}

export function ProjectProgressBar({
  total,
  completed,
  inProgress = 0,
  className,
  showLabels = true,
}: ProjectProgressBarProps) {
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct =
    total > 0 ? Math.round((inProgress / total) * 100) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completed} of {total} completed
          </span>
          <span className="font-medium text-foreground">{completedPct}%</span>
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
        {/* Completed segment */}
        <div
          className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${completedPct}%` }}
        />
        {/* In-progress segment */}
        {inProgressPct > 0 && (
          <div
            className="absolute top-0 h-full bg-amber-500 transition-all duration-300"
            style={{
              left: `${completedPct}%`,
              width: `${inProgressPct}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}
