import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

/** Parse an API date/datetime string, tolerating null/invalid input. */
function parse(iso?: string | null): Date | null {
  if (!iso) return null;
  const d = parseISO(iso);
  return isValid(d) ? d : null;
}

/** "Aug 26, 2026" — or an em dash when empty. */
export function formatDate(iso?: string | null): string {
  const d = parse(iso);
  return d ? format(d, "MMM d, yyyy") : "—";
}

/** "Aug 26, 2026 · 3:04 PM". */
export function formatDateTime(iso?: string | null): string {
  const d = parse(iso);
  return d ? format(d, "MMM d, yyyy · h:mm a") : "—";
}

/** "3 days ago", "in 2 hours". */
export function formatRelative(iso?: string | null): string {
  const d = parse(iso);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
}

/** True when a date-only due date is strictly before today (local). */
export function isPastDue(iso?: string | null): boolean {
  const d = parse(iso);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}
