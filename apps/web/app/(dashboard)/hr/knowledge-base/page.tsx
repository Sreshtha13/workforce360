"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { formatDateTime } from "@/lib/ticket-sla";
import type { KnowledgeBaseArticle } from "@/types/helpdesk";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  AlertBanner,
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/admin/admin-states";
import { FormSheet } from "@/components/admin/form-sheet";
import { FormField, FormSelect, FormTextarea } from "@/components/admin/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const emptyForm = {
  title: "",
  content: "",
  category: "",
  tags: "",
  isPublished: "false",
};

export default function KnowledgeBasePage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<KnowledgeBaseArticle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("ticket.manage");
  const canView = hasPermission("ticket.read") || canManage;

  const listQuery = useQuery({
    queryKey: ["helpdesk", "kb", "staff"],
    queryFn: async () => (await apiClient.helpdesk.listKb()).data ?? [],
    enabled: canView,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category.trim() || undefined,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isPublished: form.isPublished === "true",
      };
      if (editing) {
        return apiClient.helpdesk.updateKb(editing.id, payload);
      }
      return apiClient.helpdesk.createKb(payload);
    },
    onSuccess: () => {
      setSheetOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFeedback(editing ? "Article updated." : "Article created.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "kb"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to save article"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.helpdesk.deleteKb(id),
    onSuccess: () => {
      setFeedback("Article deleted.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["helpdesk", "kb"] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Failed to delete article"),
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view the knowledge base." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading articles..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Failed to load articles." onRetry={() => listQuery.refetch()} />
    );
  }

  const articles = (listQuery.data ?? []) as KnowledgeBaseArticle[];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Knowledge base"
        description="Publish help articles for employees and support staff."
        actionLabel={canManage ? "New article" : undefined}
        onAction={
          canManage
            ? () => {
                setEditing(null);
                setForm(emptyForm);
                setSheetOpen(true);
              }
            : undefined
        }
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      {articles.length === 0 ? (
        <EmptyState
          title="No articles"
          description="Create a knowledge base article to help employees self-serve."
          icon={BookOpen}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Views</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                {canManage && <th className="px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-b border-white/10 last:border-0">
                  <td className="px-4 py-3 font-medium">{article.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {article.category ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={article.isPublished ? "success" : "warning"}>
                      {article.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{article.viewCount}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(article.updatedAt)}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(article);
                            setForm({
                              title: article.title,
                              content: article.content,
                              category: article.category ?? "",
                              tags: (article.tags ?? []).join(", "),
                              isPublished: article.isPublished ? "true" : "false",
                            });
                            setSheetOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(article.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={editing ? "Edit article" : "New article"}
        description="Articles marked published are searchable in the employee portal."
        onSubmit={() => saveMutation.mutate()}
        loading={saveMutation.isPending}
        size="wide"
      >
        <FormField
          label="Title"
          name="title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          required
        />
        <FormField
          label="Category"
          name="category"
          value={form.category}
          onChange={(v) => setForm((f) => ({ ...f, category: v }))}
        />
        <FormField
          label="Tags (comma-separated)"
          name="tags"
          value={form.tags}
          onChange={(v) => setForm((f) => ({ ...f, tags: v }))}
        />
        <FormSelect
          label="Published"
          name="isPublished"
          value={form.isPublished}
          onChange={(v) => setForm((f) => ({ ...f, isPublished: v }))}
          options={[
            { value: "false", label: "Draft" },
            { value: "true", label: "Published" },
          ]}
        />
        <FormTextarea
          label="Content"
          name="content"
          value={form.content}
          onChange={(v) => setForm((f) => ({ ...f, content: v }))}
          rows={10}
          required
        />
      </FormSheet>
    </div>
  );
}
