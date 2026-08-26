import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Organize your work into projects."
      />
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Your projects will appear here.
        </CardContent>
      </Card>
    </div>
  );
}
