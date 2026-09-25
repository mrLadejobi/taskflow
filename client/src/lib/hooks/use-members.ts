import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  acceptInvitation,
  addProjectMember,
  createProjectInvitation,
  listProjectMembers,
  removeProjectMember,
  updateMemberRole,
} from "@/lib/api/members";
import { queryKeys } from "./keys";
import type {
  ProjectMemberInviteInput,
  ProjectMemberUpdateInput,
} from "@/lib/types";

export function useProjectMembers(projectId: number | null) {
  return useQuery({
    queryKey: projectId ? queryKeys.projectMembers(projectId) : ["noop-members"],
    queryFn: () => (projectId ? listProjectMembers(projectId) : Promise.resolve([])),
    enabled: projectId !== null && projectId > 0,
  });
}

export function useAddProjectMember(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectMemberInviteInput) =>
      addProjectMember(projectId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) });
      toast.success("Team member added");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to add member");
    },
  });
}

export function useUpdateMemberRole(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      input,
    }: {
      userId: number;
      input: ProjectMemberUpdateInput;
    }) => updateMemberRole(projectId, userId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) });
      toast.success("Role updated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update role");
    },
  });
}

export function useRemoveProjectMember(projectId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => removeProjectMember(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projectMembers(projectId) });
      toast.success("Member removed");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to remove member");
    },
  });
}

export function useCreateInvitation(projectId: number) {
  return useMutation({
    mutationFn: (input: ProjectMemberInviteInput) =>
      createProjectInvitation(projectId, input),
    onSuccess: () => {
      toast.success("Invitation generated");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to generate invite");
    },
  });
}

export function useAcceptInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => acceptInvitation(token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Invitation accepted! Welcome to the project.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to accept invite");
    },
  });
}
