"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as tagsApi from "@/lib/api/tags";
import type { ListParams } from "@/lib/types";
import { queryKeys } from "./keys";

export function useTags(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.tags(params),
    queryFn: () => tagsApi.listTags(params),
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => tagsApi.createTag(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagsApi.deleteTag(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
