import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createSubtask,
  deleteSubtask,
  listSubtasks,
  reorderSubtasks,
  updateSubtask,
} from "@/lib/api/subtasks";
import { queryKeys } from "./keys";
import type { SubtaskCreateInput, SubtaskUpdateInput } from "@/lib/types";

export function useSubtasks(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? queryKeys.subtasks(taskId) : ["noop-subtasks"],
    queryFn: () => (taskId ? listSubtasks(taskId) : Promise.resolve([])),
    enabled: taskId !== null && taskId > 0,
  });
}

export function useCreateSubtask(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubtaskCreateInput) => createSubtask(taskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subtasks(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      qc.invalidateQueries({ queryKey: ["project"] });
      toast.success("Subtask added");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to add subtask");
    },
  });
}

export function useUpdateSubtask(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      subtaskId,
      input,
    }: {
      subtaskId: number;
      input: SubtaskUpdateInput;
    }) => updateSubtask(subtaskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subtasks(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      qc.invalidateQueries({ queryKey: ["project"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update subtask");
    },
  });
}

export function useDeleteSubtask(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskId: number) => deleteSubtask(subtaskId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subtasks(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.task(taskId) });
      qc.invalidateQueries({ queryKey: ["project"] });
      toast.success("Subtask deleted");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to delete subtask");
    },
  });
}

export function useReorderSubtasks(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (subtaskIds: number[]) => reorderSubtasks(taskId, subtaskIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.subtasks(taskId) });
    },
  });
}
