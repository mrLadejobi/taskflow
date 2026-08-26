"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import * as tasksApi from "@/lib/api/tasks";
import { getMyTasks } from "@/lib/api/users";
import type {
  TaskCreateInput,
  TaskListParams,
  TaskStatus,
  TaskUpdateInput,
} from "@/lib/types";
import { queryKeys, TASK_INVALIDATION_PREFIXES } from "./keys";

/** Invalidate every query whose data can change when a task changes. */
function invalidateTaskQueries(qc: QueryClient, taskId?: number) {
  TASK_INVALIDATION_PREFIXES.forEach((prefix) =>
    qc.invalidateQueries({ queryKey: [...prefix] }),
  );
  if (taskId) qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
}

export function useProjectTasks(projectId: number, params: TaskListParams = {}) {
  return useQuery({
    queryKey: queryKeys.projectTasks(projectId, params),
    queryFn: () => tasksApi.listProjectTasks(projectId, params),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

export function useMyTasks(params: TaskListParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.myTasks(params),
    queryFn: () => getMyTasks(params),
    enabled,
  });
}

export function useTask(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => tasksApi.getTask(id),
    enabled: enabled && Number.isFinite(id) && id > 0,
  });
}

export function useCreateTask(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskCreateInput) =>
      tasksApi.createTask(projectId, input),
    onSuccess: () => invalidateTaskQueries(qc),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: TaskUpdateInput }) =>
      tasksApi.updateTask(id, input),
    onSuccess: (task) => invalidateTaskQueries(qc, task.id),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.deleteTask(id),
    onSuccess: () => invalidateTaskQueries(qc),
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.completeTask(id),
    onSuccess: (task) => invalidateTaskQueries(qc, task.id),
  });
}

export function useReopenTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.reopenTask(id),
    onSuccess: (task) => invalidateTaskQueries(qc, task.id),
  });
}

export function useAddTaskTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      tasksApi.addTaskTag(id, name),
    onSuccess: (task) => {
      invalidateTaskQueries(qc, task.id);
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useRemoveTaskTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tagId }: { id: number; tagId: number }) =>
      tasksApi.removeTaskTag(id, tagId),
    onSuccess: (task) => invalidateTaskQueries(qc, task.id),
  });
}

export function useBulkUpdateStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: number[]; status: TaskStatus }) =>
      tasksApi.bulkUpdateStatus(ids, status),
    onSuccess: () => invalidateTaskQueries(qc),
  });
}

export function useBulkDeleteTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => tasksApi.bulkDeleteTasks(ids),
    onSuccess: () => invalidateTaskQueries(qc),
  });
}
