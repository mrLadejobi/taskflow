"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getErrorMessage } from "@/lib/api/client";
import { useDeleteProject } from "@/lib/hooks/use-projects";
import { formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { ProjectFormDialog } from "./project-form-dialog";

/** A clickable project tile with an edit/delete menu. */
export function ProjectCard({ project }: { project: Project }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteProject = useDeleteProject();

  async function handleDelete() {
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted");
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't delete project"));
      throw error; // keep the confirm dialog open on failure
    }
  }

  return (
    <>
      <Card className="relative flex flex-col transition-shadow hover:shadow-md">
        <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-base">
              <Link
                href={`/projects/${project.id}`}
                className="after:absolute after:inset-0 hover:underline"
              >
                {project.name}
              </Link>
            </CardTitle>
            {project.description ? (
              <CardDescription className="line-clamp-2">
                {project.description}
              </CardDescription>
            ) : (
              <CardDescription className="italic">
                No description
              </CardDescription>
            )}
          </div>
          <div className="relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Project actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="mt-auto">
          <p className="text-xs text-muted-foreground">
            Created {formatDate(project.created_at)}
          </p>
        </CardContent>
      </Card>

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete project?"
        description={
          <>
            <span className="font-medium text-foreground">{project.name}</span>{" "}
            and all of its tasks will be permanently deleted. This can&apos;t be
            undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}
