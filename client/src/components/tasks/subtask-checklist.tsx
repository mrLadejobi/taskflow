"use client";

import { useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  useCreateSubtask,
  useDeleteSubtask,
  useSubtasks,
  useUpdateSubtask,
} from "@/lib/hooks/use-subtasks";

interface SubtaskChecklistProps {
  taskId: number;
}

export function SubtaskChecklist({ taskId }: SubtaskChecklistProps) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask(taskId);
  const updateSubtask = useUpdateSubtask(taskId);
  const deleteSubtask = useDeleteSubtask(taskId);

  const [newTitle, setNewTitle] = useState("");

  const total = subtasks.length;
  const completed = subtasks.filter((s) => s.is_completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createSubtask.mutate(
      { title: newTitle.trim() },
      {
        onSuccess: () => setNewTitle(""),
      },
    );
  };

  const handleToggle = (subtaskId: number, currentState: boolean) => {
    updateSubtask.mutate({
      subtaskId,
      input: { is_completed: !currentState },
    });
  };

  const handleDelete = (subtaskId: number) => {
    deleteSubtask.mutate(subtaskId);
  };

  if (isLoading) {
    return <div className="py-4 text-xs text-muted-foreground">Loading checklist...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {completed} of {total} completed
            </span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-1.5">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="group flex items-center justify-between rounded-lg border border-border/40 bg-card/60 p-2.5 transition-colors hover:border-border hover:bg-card"
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={subtask.is_completed}
                onCheckedChange={() => handleToggle(subtask.id, subtask.is_completed)}
                id={`subtask-${subtask.id}`}
              />
              <label
                htmlFor={`subtask-${subtask.id}`}
                className={`cursor-pointer text-sm font-medium ${
                  subtask.is_completed
                    ? "text-muted-foreground line-through decoration-muted-foreground/60"
                    : "text-foreground"
                }`}
              >
                {subtask.title}
              </label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
              onClick={() => handleDelete(subtask.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {total === 0 && (
          <div className="py-3 text-center text-xs text-muted-foreground">
            No subtasks yet. Add steps below to break this task down.
          </div>
        )}
      </div>

      {/* Add subtask input */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          placeholder="Add a step..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="h-9 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!newTitle.trim() || createSubtask.isPending}
          className="h-9 px-3"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add
        </Button>
      </form>
    </div>
  );
}
