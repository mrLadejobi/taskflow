"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/client";
import { useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/labels";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/types";
import type { Task } from "@/lib/types";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().trim().max(4000, "Description is too long").optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  /** When provided, the dialog edits this task instead of creating one. */
  task?: Task;
}

/** Create or edit a task's core fields (title, description, status, priority, due date). */
export function TaskFormDialog({
  open,
  onOpenChange,
  projectId,
  task,
}: TaskFormDialogProps) {
  const isEdit = !!task;
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      due_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? "",
        description: task?.description ?? "",
        status: task?.status ?? "todo",
        priority: task?.priority ?? "medium",
        due_date: task?.due_date ?? "",
      });
    }
  }, [open, task, reset]);

  async function onSubmit(values: FormValues) {
    const due_date = values.due_date?.trim() ? values.due_date : null;
    const description = values.description?.trim() || null;
    try {
      if (isEdit) {
        await updateTask.mutateAsync({
          id: task.id,
          input: {
            title: values.title,
            description,
            status: values.status,
            priority: values.priority,
            due_date,
          },
        });
        toast.success("Task updated");
      } else {
        // The create endpoint doesn't accept status; new tasks start in To Do.
        await createTask.mutateAsync({
          title: values.title,
          description,
          priority: values.priority,
          due_date,
        });
        toast.success("Task created");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, "Couldn't save task"));
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !isSubmitting && onOpenChange(o)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Design the landing page"
              aria-invalid={!!errors.title}
              autoFocus
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add more detail…"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isEdit && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" type="date" {...register("due_date")} />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
