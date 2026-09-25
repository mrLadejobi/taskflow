import { useQuery } from "@tanstack/react-query";
import { getProjectActivity, getTaskActivity } from "@/lib/api/activity";
import { queryKeys } from "./keys";
import type { ListParams } from "@/lib/types";

export function useProjectActivity(projectId: number | null, params: ListParams = {}) {
  return useQuery({
    queryKey: projectId ? queryKeys.projectActivity(projectId, params) : ["noop-activity"],
    queryFn: () => (projectId ? getProjectActivity(projectId, params) : Promise.resolve({ items: [], total: 0, limit: 50, offset: 0 })),
    enabled: projectId !== null && projectId > 0,
  });
}

export function useTaskActivity(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? queryKeys.taskActivity(taskId) : ["noop-task-activity"],
    queryFn: () => (taskId ? getTaskActivity(taskId) : Promise.resolve([])),
    enabled: taskId !== null && taskId > 0,
  });
}
