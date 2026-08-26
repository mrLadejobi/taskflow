import { api } from "./client";
import type { Page, Task, TaskListParams, User } from "@/lib/types";

export interface UpdateMeInput {
  full_name?: string | null;
  password?: string;
}

/** The currently authenticated user. */
export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}

export async function updateMe(input: UpdateMeInput): Promise<User> {
  const { data } = await api.patch<User>("/users/me", input);
  return data;
}

/** Tasks assigned to the current user across every project. */
export async function getMyTasks(params: TaskListParams = {}): Promise<Page<Task>> {
  const { data } = await api.get<Page<Task>>("/users/me/tasks", { params });
  return data;
}

export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`);
  return data;
}
