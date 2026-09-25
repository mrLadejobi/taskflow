import { api } from "./client";
import type { Subtask, SubtaskCreateInput, SubtaskUpdateInput } from "@/lib/types";

export async function listSubtasks(taskId: number): Promise<Subtask[]> {
  const { data } = await api.get<Subtask[]>(`/tasks/${taskId}/subtasks`);
  return data;
}

export async function createSubtask(
  taskId: number,
  input: SubtaskCreateInput,
): Promise<Subtask> {
  const { data } = await api.post<Subtask>(`/tasks/${taskId}/subtasks`, input);
  return data;
}

export async function updateSubtask(
  subtaskId: number,
  input: SubtaskUpdateInput,
): Promise<Subtask> {
  const { data } = await api.patch<Subtask>(`/subtasks/${subtaskId}`, input);
  return data;
}

export async function deleteSubtask(subtaskId: number): Promise<void> {
  await api.delete(`/subtasks/${subtaskId}`);
}

export async function reorderSubtasks(
  taskId: number,
  subtaskIds: number[],
): Promise<Subtask[]> {
  const { data } = await api.post<Subtask[]>(`/tasks/${taskId}/subtasks/reorder`, {
    subtask_ids: subtaskIds,
  });
  return data;
}
