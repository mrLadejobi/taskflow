import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="An overview of your projects and tasks."
      />
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Charts and stats are coming online.
        </CardContent>
      </Card>
    </div>
  );
}
