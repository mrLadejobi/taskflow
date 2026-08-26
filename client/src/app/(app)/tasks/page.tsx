import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function MyTasksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Tasks"
        description="Everything assigned to you, across all projects."
      />
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Tasks assigned to you will appear here.
        </CardContent>
      </Card>
    </div>
  );
}
