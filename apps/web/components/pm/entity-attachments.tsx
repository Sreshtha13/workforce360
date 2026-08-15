"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { uploadFileViaPresign } from "@/lib/upload";
import type { DocumentContext } from "@/types/documents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EntityAttachmentsProps = {
  entityId: string;
  context?: DocumentContext;
  title?: string;
};

export function EntityAttachments({
  entityId,
  context = "GENERAL",
  title = "Attachments",
}: EntityAttachmentsProps) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");

  const docsQuery = useQuery({
    queryKey: ["documents", context, entityId],
    queryFn: async () => {
      const res = await apiClient.documents.list({
        context,
        contextEntityId: entityId,
      });
      return res.data ?? [];
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const stored = await uploadFileViaPresign(file, "DOCUMENT");
      return apiClient.documents.create({
        title: docTitle.trim() || file.name,
        context,
        contextEntityId: entityId,
        fileId: stored.id,
        changeNotes: "Initial upload",
      });
    },
    onSuccess: () => {
      setFile(null);
      setDocTitle("");
      queryClient.invalidateQueries({ queryKey: ["documents", context, entityId] });
    },
  });

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <Paperclip className="h-4 w-4" />
        {title}
      </h3>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="attach-title">Title</Label>
          <Input
            id="attach-title"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="File name"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="attach-file">File</Label>
          <Input
            id="attach-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
      <Button
        size="sm"
        disabled={!file || uploadMutation.isPending}
        onClick={() => uploadMutation.mutate()}
      >
        {uploadMutation.isPending ? "Uploading..." : "Upload attachment"}
      </Button>

      <ul className="space-y-2">
        {(docsQuery.data ?? []).map((doc) => (
          <li
            key={doc.id}
            className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
          >
            <span>{doc.title}</span>
            {doc.currentVersion?.file?.originalName && (
              <span className="text-muted-foreground text-xs">
                {doc.currentVersion.file.originalName}
              </span>
            )}
          </li>
        ))}
        {(docsQuery.data ?? []).length === 0 && (
          <li className="text-sm text-muted-foreground">No attachments yet.</li>
        )}
      </ul>
    </div>
  );
}
