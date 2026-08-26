"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as projectsApi from "@/lib/api/projects";
import type {
  ListParams,
  ProjectCreateInput,
  ProjectUpdateInput,
} from "@/lib/types";
import { queryKeys } from "./keys";

export function useProjects(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.projects(params),
    queryFn: () => projectsApi.listProjects(params),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => projectsApi.getProject(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectCreateInput) =>
      projectsApi.createProject(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateProject(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectUpdateInput) =>
      projectsApi.updateProject(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: queryKeys.project(id) });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.deleteProject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
