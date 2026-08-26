import { api } from "./client";
import type {
  ListParams,
  Page,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectWithStats,
} from "@/lib/types";

export async function listProjects(
  params: ListParams = {},
): Promise<Page<Project>> {
  const { data } = await api.get<Page<Project>>("/projects", { params });
  return data;
}

export async function getProject(id: number): Promise<ProjectWithStats> {
  const { data } = await api.get<ProjectWithStats>(`/projects/${id}`);
  return data;
}

export async function createProject(
  input: ProjectCreateInput,
): Promise<Project> {
  const { data } = await api.post<Project>("/projects", input);
  return data;
}

export async function updateProject(
  id: number,
  input: ProjectUpdateInput,
): Promise<Project> {
  const { data } = await api.patch<Project>(`/projects/${id}`, input);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await api.delete(`/projects/${id}`);
}
