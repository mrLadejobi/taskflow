"use client";

import { Bell, Check, Inbox } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/lib/hooks/use-notifications";
import { formatDate } from "@/lib/format";

export function NotificationBell() {
  const { data: countData } = useUnreadNotificationCount();
  const { data: notificationsData } = useNotifications({ limit: 10 });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = countData?.unread_count ?? 0;
  const notifications = notificationsData?.items ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b border-border/40 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {unreadCount} unread
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          <div className="divide-y divide-border/30">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 transition-colors hover:bg-muted/40 ${
                  !notif.is_read ? "bg-primary/5" : ""
                }`}
                onClick={() => {
                  if (!notif.is_read) {
                    markRead.mutate(notif.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    {notif.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDate(notif.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {notif.message}
                </p>
                {notif.link && (
                  <Link
                    href={notif.link}
                    className="mt-1.5 inline-block text-[11px] font-medium text-primary hover:underline"
                  >
                    View details &rarr;
                  </Link>
                )}
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Inbox className="mx-auto mb-2 h-6 w-6 opacity-30" />
                You&apos;re all caught up!
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
