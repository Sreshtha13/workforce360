/** Phase 9 — Document Management System (backend is source of truth). */

import type { StoredFile } from "@/types/phase2";

export type DocumentContext = "EMPLOYEE" | "CANDIDATE" | "PROJECT" | "GENERAL";

export type DocumentAccessLevel = "VIEW" | "EDIT" | "DELETE" | "MANAGE";

export type DocumentCategory = {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  context?: DocumentContext | null;
  createdAt: string;
  updatedAt: string;
};

export type DocumentVersion = {
  id: string;
  documentId: string;
  versionNumber: number;
  fileId: string;
  changeNotes?: string | null;
  uploadedById: string;
  createdAt: string;
  file?: StoredFile | null;
  uploadedBy?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type DocumentPermission = {
  id: string;
  documentId: string;
  userId?: string | null;
  roleCode?: string | null;
  accessLevel: DocumentAccessLevel;
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type ManagedDocument = {
  id: string;
  title: string;
  description?: string | null;
  categoryId?: string | null;
  context: DocumentContext | string;
  contextEntityId?: string | null;
  currentVersionId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  category?: DocumentCategory | null;
  currentVersion?: (DocumentVersion & { file?: StoredFile | null }) | null;
  versions?: DocumentVersion[];
  permissions?: DocumentPermission[];
  createdBy?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type CreateDocumentInput = {
  title: string;
  description?: string;
  categoryId?: string;
  context?: DocumentContext;
  contextEntityId?: string;
  fileId: string;
  changeNotes?: string;
};

export type CreateDocumentCategoryInput = {
  name: string;
  code: string;
  description?: string;
  context?: DocumentContext;
};

export type SetDocumentPermissionsInput = {
  permissions: Array<{
    userId?: string | null;
    roleCode?: string | null;
    accessLevel: DocumentAccessLevel;
  }>;
};
