"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { Task, TaskComment } from "@/types/pm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function formatWhen(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function TaskComments({ task }: { task: Task }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiClient.pm.tasks.addComment({
        taskId: task.id,
        userId: user!.id,
        content: content.trim(),
      }),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["pm", "tasks", task.id] });
    },
  });

  const comments = task.comments ?? [];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Discussion ({comments.length})</h3>
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {comments.length === 0 && (
          <p className="text-sm text-muted-foreground">No comments yet. Start the discussion.</p>
        )}
        {comments.map((comment: TaskComment) => (
          <div key={comment.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {comment.user
                  ? `${comment.user.firstName} ${comment.user.lastName}`
                  : "User"}
              </span>
              <time dateTime={comment.createdAt}>{formatWhen(comment.createdAt)}</time>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
        />
        <Button
          size="sm"
          disabled={!content.trim() || mutation.isPending || !user}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Posting..." : "Post comment"}
        </Button>
      </div>
    </div>
  );
}
