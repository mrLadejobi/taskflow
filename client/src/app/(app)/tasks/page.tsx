"use client";

import { PageHeader } from "@/components/app/page-header";
import { TaskTableView } from "@/components/tasks/task-table-view";

export default function MyTasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks"
        description="Everything assigned to you, across all projects."
      />
      <TaskTableView />
    </div>
  );
}
