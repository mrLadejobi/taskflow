"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/labels";
import { TASK_STATUSES } from "@/lib/types";
import type { StatusCounts } from "@/lib/types";
import { ChartTooltip } from "./chart-tooltip";

/** Donut of tasks broken down by status, with the total in the center. */
export function StatusDonut({ tasks }: { tasks: StatusCounts }) {
  const data = TASK_STATUSES.map((status) => ({
    name: STATUS_LABELS[status],
    value: tasks[status],
    color: STATUS_COLORS[status],
  }));
  const hasData = tasks.total > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Tasks by status</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {hasData ? (
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center total */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{tasks.total}</span>
              <span className="text-xs text-muted-foreground">total tasks</span>
            </div>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No tasks yet
          </div>
        )}
        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}</span>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
