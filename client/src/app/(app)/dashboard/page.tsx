"use client";

import {
  AlertTriangle,
  CalendarClock,
  FolderKanban,
  ListTodo,
  UserCheck,
} from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { PriorityBar } from "@/components/dashboard/priority-bar";
import { ProgressOverview } from "@/components/dashboard/progress-overview";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusDonut } from "@/components/dashboard/status-donut";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/lib/hooks/use-dashboard";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="An overview of your projects and tasks."
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError || !data ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div className="space-y-1">
              <p className="font-medium">Couldn&apos;t load your dashboard</p>
              <p className="text-sm text-muted-foreground">
                Check your connection and try again.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total tasks"
              value={data.tasks.total}
              icon={ListTodo}
              hint={`${data.tasks.done} done`}
            />
            <StatCard
              label="Projects"
              value={data.projects}
              icon={FolderKanban}
              accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              label="Overdue"
              value={data.overdue}
              icon={CalendarClock}
              accent="bg-red-500/10 text-red-600 dark:text-red-400"
              hint={data.overdue > 0 ? "Needs attention" : "All caught up"}
            />
            <StatCard
              label="Assigned to me"
              value={data.assigned_to_me}
              icon={UserCheck}
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <ProgressOverview tasks={data.tasks} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <StatusDonut tasks={data.tasks} />
            <PriorityBar byPriority={data.by_priority} />
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
