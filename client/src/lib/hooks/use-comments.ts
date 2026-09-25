import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addComment,
  deleteComment,
  listTaskComments,
  updateComment,
} from "@/lib/api/comments";
import { queryKeys } from "./keys";
import type { CommentCreateInput, CommentUpdateInput } from "@/lib/types";

export function useComments(taskId: number | null) {
  return useQuery({
    queryKey: taskId ? queryKeys.comments(taskId) : ["noop-comments"],
    queryFn: () => (taskId ? listTaskComments(taskId) : Promise.resolve([])),
    enabled: taskId !== null && taskId > 0,
  });
}

export function useAddComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CommentCreateInput) => addComment(taskId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
      qc.invalidateQueries({ queryKey: queryKeys.taskActivity(taskId) });
      toast.success("Comment added");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to add comment");
    },
  });
}

export function useUpdateComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      input,
    }: {
      commentId: number;
      input: CommentUpdateInput;
    }) => updateComment(commentId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
      toast.success("Comment updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update comment");
    },
  });
}

export function useDeleteComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(taskId) });
      toast.success("Comment deleted");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to delete comment");
    },
  });
}
