"use client";

import { Download, FileJson, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportTasksCsv, exportTasksJson } from "@/lib/api/export";
import { toast } from "sonner";

interface TaskExportDropdownProps {
  projectId: number;
  projectName?: string;
}

export function TaskExportDropdown({
  projectId,
  projectName = "project",
}: TaskExportDropdownProps) {
  const handleCsv = async () => {
    try {
      await exportTasksCsv(projectId, projectName);
      toast.success("CSV file downloaded");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handleJson = async () => {
    try {
      const data = await exportTasksJson(projectId);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${projectName}_tasks.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("JSON file downloaded");
    } catch {
      toast.error("Failed to export JSON");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={handleCsv} className="cursor-pointer text-xs">
          <FileSpreadsheet className="mr-2 h-3.5 w-3.5 text-emerald-500" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleJson} className="cursor-pointer text-xs">
          <FileJson className="mr-2 h-3.5 w-3.5 text-sky-500" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
