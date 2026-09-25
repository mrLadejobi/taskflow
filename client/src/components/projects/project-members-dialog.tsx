"use client";

import { useState } from "react";
import { Copy, Shield, Trash2, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAddProjectMember,
  useCreateInvitation,
  useProjectMembers,
  useRemoveProjectMember,
  useUpdateMemberRole,
} from "@/lib/hooks/use-members";
import { formatDate } from "@/lib/format";
import type { ProjectRole } from "@/lib/types";

interface ProjectMembersDialogProps {
  projectId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectMembersDialog({
  projectId,
  open,
  onOpenChange,
}: ProjectMembersDialogProps) {
  const { data: members = [], isLoading } = useProjectMembers(open ? projectId : null);
  const addMember = useAddProjectMember(projectId);
  const updateRole = useUpdateMemberRole(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const createInvite = useCreateInvitation(projectId);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ProjectRole>("member");
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    addMember.mutate(
      { email: email.trim(), role },
      {
        onSuccess: () => {
          setEmail("");
        },
      },
    );
  };

  const handleGenerateInvite = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address for the invite");
      return;
    }
    createInvite.mutate(
      { email: email.trim(), role },
      {
        onSuccess: (data) => {
          const origin = typeof window !== "undefined" ? window.location.origin : "";
          const link = `${origin}/invitations/accept?token=${data.token}`;
          setInviteLink(link);
          navigator.clipboard.writeText(link);
          toast.success("Invitation link generated and copied to clipboard!");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Project Collaborators
          </DialogTitle>
          <DialogDescription>
            Invite teammates and manage permission roles for this project.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Add member form */}
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="colleague@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 text-sm"
              />
              <Select value={role} onValueChange={(v) => setRole(v as ProjectRole)}>
                <SelectTrigger className="w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" size="sm" disabled={!email.trim() || addMember.isPending}>
                <UserPlus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateInvite}
                disabled={!email.trim() || createInvite.isPending}
                className="text-xs"
              >
                <Copy className="mr-1 h-3 w-3" /> Copy Invite Link
              </Button>
            </div>
          </form>

          {inviteLink && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
              <span className="font-semibold text-primary">Invite Link:</span>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                {inviteLink}
              </p>
            </div>
          )}

          {/* Member roster */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Members ({members.length})
            </span>

            {isLoading ? (
              <div className="py-4 text-center text-xs text-muted-foreground">Loading members...</div>
            ) : (
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg border border-border/40 bg-card p-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-7 w-7 text-xs">
                        <AvatarFallback>
                          {(member.user?.full_name?.[0] || member.user?.email?.[0] || "U").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          {member.user?.full_name || member.user?.email}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Joined {formatDate(member.joined_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(val) =>
                          updateRole.mutate({
                            userId: member.user_id,
                            input: { role: val as ProjectRole },
                          })
                        }
                      >
                        <SelectTrigger className="h-7 w-24 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMember.mutate(member.user_id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {members.length === 0 && (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    No collaborators added yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
