"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { TASK_STATUSES } from "@/lib/types";
import type { StatusCounts } from "@/lib/types";

/** A segmented completion bar summarizing progress across all tasks. */
export function ProgressOverview({ tasks }: { tasks: StatusCounts }) {
  const pct =
    tasks.total > 0 ? Math.round((tasks.done / tasks.total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Overall progress</CardTitle>
        <span className="text-2xl font-bold tabular-nums">{pct}%</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {TASK_STATUSES.map((status) => {
            const value = tasks[status];
            if (!value || tasks.total === 0) return null;
            return (
              <div
                key={status}
                style={{
                  width: `${(value / tasks.total) * 100}%`,
                  backgroundColor: STATUS_COLORS[status],
                }}
                title={`${STATUS_LABELS[status]}: ${value}`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          {TASK_STATUSES.map((status) => (
            <span key={status} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {STATUS_LABELS[status]}
              <span className="font-medium text-foreground">
                {tasks[status]}
              </span>
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
