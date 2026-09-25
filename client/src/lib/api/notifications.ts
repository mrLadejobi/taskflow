import { api } from "./client";
import type {
  ListParams,
  Notification,
  NotificationCount,
  Page,
  UserSettings,
  UserSettingsUpdateInput,
} from "@/lib/types";

export async function listNotifications(
  params: ListParams = {},
): Promise<Page<Notification>> {
  const { data } = await api.get<Page<Notification>>("/notifications", {
    params,
  });
  return data;
}

export async function getUnreadCount(): Promise<NotificationCount> {
  const { data } = await api.get<NotificationCount>("/notifications/unread-count");
  return data;
}

export async function markNotificationRead(
  notificationId: number,
): Promise<Notification> {
  const { data } = await api.post<Notification>(
    `/notifications/${notificationId}/read`,
  );
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/notifications/read-all");
}

export async function getUserSettings(): Promise<UserSettings> {
  const { data } = await api.get<UserSettings>("/users/me/settings");
  return data;
}

export async function updateUserSettings(
  input: UserSettingsUpdateInput,
): Promise<UserSettings> {
  const { data } = await api.patch<UserSettings>("/users/me/settings", input);
  return data;
}
