import { api } from "./client";
import type {
  ProjectInvitation,
  ProjectMember,
  ProjectMemberInviteInput,
  ProjectMemberUpdateInput,
} from "@/lib/types";

export async function listProjectMembers(
  projectId: number,
): Promise<ProjectMember[]> {
  const { data } = await api.get<ProjectMember[]>(
    `/projects/${projectId}/members`,
  );
  return data;
}

export async function addProjectMember(
  projectId: number,
  input: ProjectMemberInviteInput,
): Promise<ProjectMember> {
  const { data } = await api.post<ProjectMember>(
    `/projects/${projectId}/members`,
    input,
  );
  return data;
}

export async function updateMemberRole(
  projectId: number,
  userId: number,
  input: ProjectMemberUpdateInput,
): Promise<ProjectMember> {
  const { data } = await api.patch<ProjectMember>(
    `/projects/${projectId}/members/${userId}`,
    input,
  );
  return data;
}

export async function removeProjectMember(
  projectId: number,
  userId: number,
): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

export async function createProjectInvitation(
  projectId: number,
  input: ProjectMemberInviteInput,
): Promise<ProjectInvitation> {
  const { data } = await api.post<ProjectInvitation>(
    `/projects/${projectId}/invitations`,
    input,
  );
  return data;
}

export async function acceptInvitation(token: string): Promise<ProjectMember> {
  const { data } = await api.post<ProjectMember>("/invitations/accept", {
    token,
  });
  return data;
}
