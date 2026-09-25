import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getUserSettings,
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateUserSettings,
} from "@/lib/api/notifications";
import { queryKeys } from "./keys";
import type { ListParams, UserSettingsUpdateInput } from "@/lib/types";

export function useNotifications(params: ListParams = {}) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: () => listNotifications(params),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: () => getUnreadCount(),
    refetchInterval: 30000, // Poll every 30s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });
}

export function useUserSettings() {
  return useQuery({
    queryKey: queryKeys.userSettings,
    queryFn: () => getUserSettings(),
  });
}

export function useUpdateUserSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UserSettingsUpdateInput) => updateUserSettings(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.userSettings });
      toast.success("Preferences saved");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to save preferences");
    },
  });
}
