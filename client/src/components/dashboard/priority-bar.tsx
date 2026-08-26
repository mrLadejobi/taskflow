"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIORITY_COLORS, PRIORITY_LABELS } from "@/lib/labels";
import { TASK_PRIORITIES } from "@/lib/types";
import { ChartTooltip } from "./chart-tooltip";

/** Vertical bars of task counts per priority. */
export function PriorityBar({
  byPriority,
}: {
  byPriority: Record<string, number>;
}) {
  const data = TASK_PRIORITIES.map((priority) => ({
    name: PRIORITY_LABELS[priority],
    value: byPriority[priority] ?? 0,
    color: PRIORITY_COLORS[priority],
  }));
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Tasks by priority</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        {hasData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                  content={<ChartTooltip />}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No tasks yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
