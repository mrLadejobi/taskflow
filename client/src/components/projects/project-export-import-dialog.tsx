"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { exportTasksCsv, exportTasksJson, importTasks } from "@/lib/api/export";
import type { TaskImportItem } from "@/lib/types";

interface ProjectExportImportDialogProps {
  projectId: number;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectExportImportDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
}: ProjectExportImportDialogProps) {
  const qc = useQueryClient();
  const [jsonInput, setJsonInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      await exportTasksCsv(projectId, projectName);
      toast.success("CSV export downloaded successfully");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleExportJson = async () => {
    try {
      const data = await exportTasksJson(projectId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${projectName.toLowerCase().replace(/\s+/g, "_")}_tasks.json`,
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("JSON export downloaded successfully");
    } catch {
      toast.error("Failed to export JSON");
    }
  };

  const handleImportJson = async () => {
    if (!jsonInput.trim()) return;
    try {
      setIsImporting(true);
      const parsed = JSON.parse(jsonInput) as TaskImportItem[];
      if (!Array.isArray(parsed)) {
        toast.error("Input must be a JSON array of task objects");
        return;
      }
      const summary = await importTasks(projectId, parsed);
      toast.success(
        `Import complete: ${summary.imported} tasks imported, ${summary.skipped} skipped.`,
      );
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      setJsonInput("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Invalid JSON format. Please check your syntax.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Data Import & Export
          </DialogTitle>
          <DialogDescription>
            Export tasks to CSV/JSON or bulk-import new items.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="export" className="pt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export Tasks
            </TabsTrigger>
            <TabsTrigger value="import" className="gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" /> Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 pt-4">
            <p className="text-xs text-muted-foreground">
              Download all tasks, statuses, priorities, and labels in your preferred format.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-1.5"
                onClick={handleExportCsv}
              >
                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-semibold">Spreadsheet (CSV)</span>
                <span className="text-[10px] text-muted-foreground">Excel, Google Sheets</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex-col gap-1.5"
                onClick={handleExportJson}
              >
                <Download className="h-5 w-5 text-sky-500" />
                <span className="text-xs font-semibold">Structured JSON</span>
                <span className="text-[10px] text-muted-foreground">Backups & APIs</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">
              Paste a JSON array of task objects below (e.g. <code>[{`{"title": "My Task"}`}]</code>).
            </p>

            <Textarea
              placeholder={`[\n  {\n    "title": "Design landing page",\n    "priority": "high",\n    "tags": ["design"]\n  }\n]`}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={6}
              className="font-mono text-xs"
            />

            <Button
              className="w-full"
              size="sm"
              onClick={handleImportJson}
              disabled={!jsonInput.trim() || isImporting}
            >
              {isImporting ? "Importing Tasks..." : "Run Import"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
