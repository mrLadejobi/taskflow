import { api } from "./client";
import type { ListParams, Page, Tag } from "@/lib/types";

export async function listTags(params: ListParams = {}): Promise<Page<Tag>> {
  const { data } = await api.get<Page<Tag>>("/tags", { params });
  return data;
}

export async function createTag(name: string): Promise<Tag> {
  const { data } = await api.post<Tag>("/tags", { name });
  return data;
}

export async function deleteTag(id: number): Promise<void> {
  await api.delete(`/tags/${id}`);
}
