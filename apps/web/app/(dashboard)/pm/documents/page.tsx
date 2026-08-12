"use client";

import { DocumentsPage } from "@/components/documents/documents-page";

export default function PmDocumentsPage() {
  return (
    <DocumentsPage
      title="Project documents"
      description="Documents linked to project context."
      defaultContext="PROJECT"
      lockContext
    />
  );
}
