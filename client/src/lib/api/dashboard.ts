import { api } from "./client";
import type { DashboardSummary } from "@/lib/types";

/** At-a-glance summary for the current user (counts, breakdowns, overdue). */
export async function getDashboard(): Promise<DashboardSummary> {
  const { data } = await api.get<DashboardSummary>("/dashboard");
  return data;
}
