"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { CreatePortfolioItemInput } from "@/types/bd";

export default function BdPortfolioPage() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [form, setForm] = useState<CreatePortfolioItemInput>({
    title: "",
    description: "",
    category: "",
    clientName: "",
    technologies: "",
    projectUrl: "",
    isPublished: false,
  });
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["bd", "portfolio"],
    queryFn: async () => (await apiClient.bd.portfolio.list()).data ?? [],
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePortfolioItemInput) => apiClient.bd.portfolio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "portfolio"] });
      setIsSheetOpen(false);
      setForm({
        title: "",
        description: "",
        category: "",
        clientName: "",
        technologies: "",
        projectUrl: "",
        isPublished: false,
      });
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      apiClient.bd.portfolio.update(id, { isPublished }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bd", "portfolio"] }),
  });

  if (query.isLoading) return <LoadingState message="Loading portfolio..." />;
  if (query.isError) {
    return <ErrorState message="Failed to load portfolio." onRetry={() => query.refetch()} />;
  }

  const items = query.data ?? [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Portfolio"
        description="Showcase completed work and case studies for proposals."
        actions={<Button onClick={() => setIsSheetOpen(true)}>Add item</Button>}
      />

      {items.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No portfolio items yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{item.title}</h3>
                <Badge variant={item.isPublished ? "default" : "secondary"}>
                  {item.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
              {item.clientName && (
                <p className="text-sm text-muted-foreground">Client: {item.clientName}</p>
              )}
              {item.category && <Badge variant="outline">{item.category}</Badge>}
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
              )}
              {item.technologies && (
                <p className="text-xs text-muted-foreground">{item.technologies}</p>
              )}
              <div className="flex items-center justify-between pt-2">
                {item.projectUrl ? (
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-700 hover:underline"
                  >
                    View project
                  </a>
                ) : (
                  <span />
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={publishMutation.isPending}
                  onClick={() =>
                    publishMutation.mutate({ id: item.id, isPublished: !item.isPublished })
                  }
                >
                  {item.isPublished ? "Unpublish" : "Publish"}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add portfolio item</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client name</Label>
              <Input
                id="client"
                value={form.clientName ?? ""}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category ?? ""}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tech">Technologies</Label>
              <Input
                id="tech"
                value={form.technologies ?? ""}
                onChange={(e) => setForm({ ...form, technologies: e.target.value })}
                placeholder="React, Node.js, PostgreSQL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">Project URL</Label>
              <Input
                id="url"
                type="url"
                value={form.projectUrl ?? ""}
                onChange={(e) => setForm({ ...form, projectUrl: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="published"
                type="checkbox"
                className="h-4 w-4 rounded border"
                checked={form.isPublished ?? false}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              <Label htmlFor="published">Publish immediately</Label>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create item"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
