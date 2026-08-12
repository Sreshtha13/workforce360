"use client";

import { DocumentsPage } from "@/components/documents/documents-page";

export default function HrDocumentsRoutePage() {
  return (
    <DocumentsPage
      title="HR documents"
      description="Employee and candidate context documents."
      defaultContext="EMPLOYEE"
    />
  );
}
