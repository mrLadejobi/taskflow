import type { TaskPriority, TaskStatus } from "./types";

/** Human-readable labels for task statuses. */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  review: "Review",
  done: "Done",
};

/**
 * CSS-variable colors for statuses (defined in globals.css). Usable directly
 * as an SVG `fill`/`stroke` or a CSS `color` value.
 */
export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "hsl(var(--status-todo))",
  in_progress: "hsl(var(--status-progress))",
  review: "hsl(var(--status-review))",
  done: "hsl(var(--status-done))",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "hsl(215 16% 55%)",
  medium: "hsl(217 91% 60%)",
  high: "hsl(38 92% 50%)",
  urgent: "hsl(0 84% 60%)",
};

/** Tailwind classes for a priority badge (border + text + subtle bg). */
export const PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  low: "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
  medium:
    "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  high: "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  urgent:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};
