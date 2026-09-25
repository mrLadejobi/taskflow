"use client";

import { Activity, Clock, FolderKanban } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProjects } from "@/lib/hooks/use-projects";
import { useProjectActivity } from "@/lib/hooks/use-activity";
import { formatDate } from "@/lib/format";

export function RecentActivityCard() {
  const { data: projectsData } = useProjects({ limit: 1 });
  const firstProject = projectsData?.items?.[0];
  const { data: activityData, isLoading } = useProjectActivity(firstProject?.id ?? null, {
    limit: 6,
  });

  const activities = activityData?.items ?? [];

  const formatAction = (action: string) => {
    switch (action) {
      case "comment_added":
        return "commented on a task";
      case "subtask_created":
        return "created a checklist item";
      case "subtask_toggled":
        return "updated a checklist step";
      case "member_added":
        return "joined the project";
      case "tasks_imported":
        return "imported batch tasks";
      default:
        return action.replace(/_/g, " ");
    }
  };

  return (
    <Card className="col-span-full xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" /> Workspace Activity
          </CardTitle>
          <CardDescription>
            {firstProject
              ? `Recent events in ${firstProject.name}`
              : "Audit stream of recent workspace actions"}
          </CardDescription>
        </div>

        {firstProject && (
          <Link
            href={`/projects/${firstProject.id}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            View project &rarr;
          </Link>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            Loading activity stream...
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/30 bg-muted/20 p-2.5 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Clock className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="text-xs text-foreground">
                      <span className="font-semibold">
                        {item.user?.full_name || item.user?.email || "Teammate"}
                      </span>{" "}
                      <span className="text-muted-foreground">
                        {formatAction(item.action)}
                      </span>
                    </p>
                    {item.details && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground font-mono truncate max-w-xs sm:max-w-md">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatDate(item.created_at)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-muted-foreground">
            <FolderKanban className="mx-auto mb-2 h-6 w-6 opacity-30" />
            No recent activity recorded yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
