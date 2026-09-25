import { api } from "./client";
import type { ActivityLog, ListParams, Page } from "@/lib/types";

export async function getProjectActivity(
  projectId: number,
  params: ListParams = {},
): Promise<Page<ActivityLog>> {
  const { data } = await api.get<Page<ActivityLog>>(
    `/projects/${projectId}/activity`,
    { params },
  );
  return data;
}

export async function getTaskActivity(taskId: number): Promise<ActivityLog[]> {
  const { data } = await api.get<ActivityLog[]>(`/tasks/${taskId}/activity`);
  return data;
}
