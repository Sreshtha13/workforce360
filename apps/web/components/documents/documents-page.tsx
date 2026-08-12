"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { uploadFileViaPresign } from "@/lib/upload";
import { formatDateTime } from "@/lib/ticket-sla";
import type { DocumentContext, ManagedDocument } from "@/types/documents";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const CONTEXT_OPTIONS = [
  { value: "", label: "All contexts" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "CANDIDATE", label: "Candidate" },
  { value: "PROJECT", label: "Project" },
  { value: "GENERAL", label: "General" },
];

type DocumentsPageProps = {
  title?: string;
  description?: string;
  defaultContext?: DocumentContext;
  lockContext?: boolean;
  defaultCreatedByMe?: boolean;
};

export function DocumentsPage({
  title = "Documents",
  description = "Browse, upload, version, and manage document permissions.",
  defaultContext,
  lockContext = false,
  defaultCreatedByMe = false,
}: DocumentsPageProps) {
  const { hasPermission, user } = useAuth();
  const queryClient = useQueryClient();
  const [context, setContext] = useState(defaultContext ?? "");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    context: defaultContext ?? "GENERAL",
    contextEntityId: "",
    changeNotes: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [versionFile, setVersionFile] = useState<File | null>(null);
  const [versionNotes, setVersionNotes] = useState("");
  const [permRoleCode, setPermRoleCode] = useState("");
  const [permAccess, setPermAccess] = useState("VIEW");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canCreate = hasPermission("document.create");
  const canUpdate = hasPermission("document.update");
  const canManage = hasPermission("document.manage");
  const canView =
    hasPermission("document.read") || canCreate || canUpdate || canManage;

  const listQuery = useQuery({
    queryKey: [
      "documents",
      context,
      search,
      defaultCreatedByMe ? user?.id : null,
    ],
    queryFn: async () =>
      (await apiClient.documents.list({
        search: search.trim() || undefined,
        context: (context || undefined) as DocumentContext | undefined,
        createdById: defaultCreatedByMe ? user?.id : undefined,
      })).data ?? [],
    enabled: canView,
  });

  const categoriesQuery = useQuery({
    queryKey: ["documents", "categories"],
    queryFn: async () => (await apiClient.documents.listCategories()).data ?? [],
    enabled: canView,
  });

  const detailQuery = useQuery({
    queryKey: ["documents", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      return (await apiClient.documents.getById(selectedId)).data ?? null;
    },
    enabled: selectedId !== null,
  });

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "No category" },
      ...(categoriesQuery.data ?? []).map((c) => ({
        value: c.id,
        label: c.name,
      })),
    ],
    [categoriesQuery.data],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["documents"] });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("File required");
      const uploaded = await uploadFileViaPresign(file, "DOCUMENT");
      return apiClient.documents.create({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        categoryId: form.categoryId || undefined,
        context: form.context as DocumentContext,
        contextEntityId: form.contextEntityId.trim() || undefined,
        fileId: uploaded.id,
        changeNotes: form.changeNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setUploadOpen(false);
      setFile(null);
      setForm({
        title: "",
        description: "",
        categoryId: "",
        context: defaultContext ?? "GENERAL",
        contextEntityId: "",
        changeNotes: "",
      });
      setFeedback("Document uploaded.");
      setError(null);
      invalidate();
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Upload failed"),
  });

  const versionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId || !versionFile) throw new Error("File required");
      const uploaded = await uploadFileViaPresign(versionFile, "DOCUMENT");
      return apiClient.documents.addVersion(selectedId, {
        fileId: uploaded.id,
        changeNotes: versionNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setVersionFile(null);
      setVersionNotes("");
      setFeedback("New version added.");
      setError(null);
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["documents", selectedId] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Version upload failed"),
  });

  const permissionsMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("No document");
      const existing = detailQuery.data?.permissions ?? [];
      const next = [
        ...existing.map((p) => ({
          userId: p.userId,
          roleCode: p.roleCode,
          accessLevel: p.accessLevel,
        })),
        {
          roleCode: permRoleCode.trim() || null,
          userId: null,
          accessLevel: permAccess as "VIEW" | "EDIT" | "DELETE" | "MANAGE",
        },
      ];
      return apiClient.documents.setPermissions(selectedId, { permissions: next });
    },
    onSuccess: () => {
      setPermRoleCode("");
      setPermAccess("VIEW");
      setPermOpen(false);
      setFeedback("Permissions updated.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["documents", selectedId] });
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Permission update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.documents.delete(id),
    onSuccess: () => {
      setSelectedId(null);
      setFeedback("Document deleted.");
      setError(null);
      invalidate();
    },
    onError: (err) =>
      setError(err instanceof ApiClientError ? err.message : "Delete failed"),
  });

  if (!canView) {
    return <ErrorState message="You do not have permission to view documents." />;
  }
  if (listQuery.isLoading) return <LoadingState message="Loading documents..." />;
  if (listQuery.isError) {
    return (
      <ErrorState message="Failed to load documents." onRetry={() => listQuery.refetch()} />
    );
  }

  const docs = (listQuery.data ?? []) as ManagedDocument[];
  const selected = detailQuery.data as ManagedDocument | null;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={title}
        description={description}
        actionLabel={canCreate ? "Upload document" : undefined}
        onAction={
          canCreate
            ? () => {
                setUploadOpen(true);
              }
            : undefined
        }
      />

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <div className="flex flex-wrap gap-4">
        {!lockContext && (
          <div className="w-48">
            <FormSelect
              label="Context"
              name="context"
              value={context}
              onChange={setContext}
              options={CONTEXT_OPTIONS}
            />
          </div>
        )}
        <div className="min-w-[200px] flex-1 max-w-sm space-y-2">
          <Label htmlFor="doc-search">Search</Label>
          <Input
            id="doc-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or description"
          />
        </div>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          title="No documents"
          description="Upload a document to get started."
          icon={FileText}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/20 bg-white/40 dark:bg-white/5">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-white/15 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Context</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr
                  key={doc.id}
                  className="cursor-pointer border-b border-white/10 last:border-0 hover:bg-white/30"
                  onClick={() => setSelectedId(doc.id)}
                >
                  <td className="px-4 py-3 font-medium">{doc.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{doc.context}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {doc.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    v{doc.currentVersion?.versionNumber ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateTime(doc.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormSheet
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        title="Upload document"
        description="Files are uploaded via secure presign, then linked as a managed document."
        onSubmit={() => createMutation.mutate()}
        loading={createMutation.isPending}
      >
        <FormField
          label="Title"
          name="title"
          value={form.title}
          onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          required
        />
        <FormTextarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          rows={3}
        />
        <FormSelect
          label="Category"
          name="categoryId"
          value={form.categoryId}
          onChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
          options={categoryOptions}
        />
        {!lockContext && (
          <FormSelect
            label="Context"
            name="docContext"
            value={form.context}
            onChange={(v) => setForm((f) => ({ ...f, context: v as DocumentContext }))}
            options={CONTEXT_OPTIONS.filter((o) => o.value)}
          />
        )}
        <FormField
          label="Context entity ID (optional)"
          name="contextEntityId"
          value={form.contextEntityId}
          onChange={(v) => setForm((f) => ({ ...f, contextEntityId: v }))}
        />
        <div className="space-y-2">
          <Label htmlFor="doc-file">File</Label>
          <Input
            id="doc-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </FormSheet>

      <Sheet open={selectedId !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.title ?? "Document"}</SheetTitle>
            <SheetDescription>
              {selected ? `${selected.context} · ${selected.category?.name ?? "Uncategorized"}` : ""}
            </SheetDescription>
          </SheetHeader>

          {detailQuery.isLoading || !selected ? (
            <p className="mt-6 text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="mt-6 space-y-4">
              {selected.description && (
                <p className="text-sm text-muted-foreground">{selected.description}</p>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Version history</p>
                {(selected.versions ?? []).map((v) => (
                  <div
                    key={v.id}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">v{v.versionNumber}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(v.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {v.file?.originalName ?? v.fileId}
                    </p>
                    {v.changeNotes && <p className="mt-1 text-xs">{v.changeNotes}</p>}
                  </div>
                ))}
              </div>

              {canUpdate && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <p className="text-sm font-medium">Add version</p>
                  <Input
                    type="file"
                    onChange={(e) => setVersionFile(e.target.files?.[0] ?? null)}
                  />
                  <FormTextarea
                    label="Change notes"
                    name="versionNotes"
                    value={versionNotes}
                    onChange={setVersionNotes}
                    rows={2}
                  />
                  <Button
                    size="sm"
                    disabled={!versionFile || versionMutation.isPending}
                    onClick={() => versionMutation.mutate()}
                  >
                    Upload version
                  </Button>
                </div>
              )}

              {canManage && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Permissions</p>
                    <Button size="sm" variant="outline" onClick={() => setPermOpen(true)}>
                      Add role access
                    </Button>
                  </div>
                  {(selected.permissions ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No explicit permissions (creator + document.manage can access).
                    </p>
                  ) : (
                    (selected.permissions ?? []).map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between rounded-lg border border-white/10 px-3 py-2 text-sm"
                      >
                        <span>{p.roleCode ?? p.userId ?? "—"}</span>
                        <Badge variant="outline">{p.accessLevel}</Badge>
                      </div>
                    ))
                  )}
                  {hasPermission("document.delete") && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(selected.id)}
                    >
                      Delete document
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <FormSheet
        open={permOpen}
        onOpenChange={setPermOpen}
        title="Add role permission"
        description="Grant a role access to this document."
        onSubmit={() => permissionsMutation.mutate()}
        loading={permissionsMutation.isPending}
      >
        <FormField
          label="Role code"
          name="roleCode"
          value={permRoleCode}
          onChange={setPermRoleCode}
          required
        />
        <FormSelect
          label="Access level"
          name="accessLevel"
          value={permAccess}
          onChange={setPermAccess}
          options={[
            { value: "VIEW", label: "View" },
            { value: "EDIT", label: "Edit" },
            { value: "DELETE", label: "Delete" },
            { value: "MANAGE", label: "Manage" },
          ]}
        />
      </FormSheet>
    </div>
  );
}

export default function HrDocumentsPage() {
  return (
    <DocumentsPage
      title="HR documents"
      description="Employee and candidate documents managed by HR."
      defaultContext="EMPLOYEE"
    />
  );
}
