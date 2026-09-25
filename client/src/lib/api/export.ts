import { api } from "./client";
import type { ImportSummary, TaskImportItem } from "@/lib/types";

export async function exportTasksJson(projectId: number): Promise<unknown[]> {
  const { data } = await api.get<unknown[]>(`/projects/${projectId}/export`, {
    params: { format: "json" },
  });
  return data;
}

export async function exportTasksCsv(
  projectId: number,
  projectName: string,
): Promise<void> {
  const response = await api.get(`/projects/${projectId}/export`, {
    params: { format: "csv" },
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `${projectName.toLowerCase().replace(/\s+/g, "_")}_tasks.csv`,
  );
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function importTasks(
  projectId: number,
  items: TaskImportItem[],
): Promise<ImportSummary> {
  const { data } = await api.post<ImportSummary>(
    `/projects/${projectId}/import`,
    items,
  );
  return data;
}
