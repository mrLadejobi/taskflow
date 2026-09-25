"use client";

import { useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/hooks/use-auth";
import {
  useAddComment,
  useComments,
  useDeleteComment,
} from "@/lib/hooks/use-comments";
import { formatDate } from "@/lib/format";

interface CommentThreadProps {
  taskId: number;
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const { user: currentUser } = useAuth();
  const { data: comments = [], isLoading } = useComments(taskId);
  const addComment = useAddComment(taskId);
  const deleteComment = useDeleteComment(taskId);

  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate(
      { content: content.trim() },
      {
        onSuccess: () => setContent(""),
      },
    );
  };

  const handleDelete = (commentId: number) => {
    deleteComment.mutate(commentId);
  };

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return (email?.[0] ?? "U").toUpperCase();
  };

  if (isLoading) {
    return <div className="py-4 text-xs text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Discussion stream */}
      <div className="space-y-3">
        {comments.map((comment) => {
          const authorName = comment.author?.full_name || comment.author?.email || "User";
          const isMe = comment.author_id === currentUser?.id;

          return (
            <div
              key={comment.id}
              className="group flex gap-3 rounded-lg border border-border/40 bg-card/60 p-3 transition-colors hover:border-border hover:bg-card"
            >
              <Avatar className="h-8 w-8 text-xs">
                <AvatarFallback>
                  {getInitials(comment.author?.full_name, comment.author?.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground">
                      {authorName}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>

                  {isMe && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          );
        })}

        {comments.length === 0 && (
          <div className="py-6 text-center text-xs text-muted-foreground">
            <MessageSquare className="mx-auto mb-2 h-6 w-6 opacity-30" />
            No comments yet. Start the conversation!
          </div>
        )}
      </div>

      {/* New comment composer */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          placeholder="Write a comment or update..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || addComment.isPending}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {addComment.isPending ? "Posting..." : "Comment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
