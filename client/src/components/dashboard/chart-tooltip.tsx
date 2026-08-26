"use client";

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  /** When set, overrides the label shown above the entries. */
  label?: string;
}

/** A theme-aware replacement for Recharts' default tooltip. */
export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      {label && <p className="mb-1 font-medium text-popover-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          {entry.color && (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
          )}
          <span className="text-popover-foreground">{entry.name}</span>
          <span className="ml-auto font-medium text-popover-foreground">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
