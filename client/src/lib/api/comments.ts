import { api } from "./client";
import type { Comment, CommentCreateInput, CommentUpdateInput } from "@/lib/types";

export async function listTaskComments(taskId: number): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(`/tasks/${taskId}/comments`);
  return data;
}

export async function addComment(
  taskId: number,
  input: CommentCreateInput,
): Promise<Comment> {
  const { data } = await api.post<Comment>(`/tasks/${taskId}/comments`, input);
  return data;
}

export async function updateComment(
  commentId: number,
  input: CommentUpdateInput,
): Promise<Comment> {
  const { data } = await api.patch<Comment>(`/comments/${commentId}`, input);
  return data;
}

export async function deleteComment(commentId: number): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}
