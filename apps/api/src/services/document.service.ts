import type { DocumentAccessLevel, DocumentContext } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { checkDocumentAccess } from "../lib/document-access";
import { DocumentRepository } from "../repositories/document.repository";

export { checkDocumentAccess } from "../lib/document-access";

export class DocumentService {
  private repo = new DocumentRepository();

  private async assertAccess(
    documentId: string,
    actorId: string,
    required: DocumentAccessLevel,
  ) {
    const doc = await this.repo.findDocumentById(documentId);
    if (!doc) throw new AppError("DOCUMENT_NOT_FOUND", "Document not found", 404);

    const roleRows = await this.repo.findUserRoleCodes(actorId);
    const actorRoleCodes = roleRows
      .map((r) => r.role.code)
      .filter((c): c is string => Boolean(c));

    const manage = await this.repo.userHasPermissionCode(actorId, "document.manage");

    const allowed = checkDocumentAccess({
      required,
      createdById: doc.createdById,
      actorId,
      actorRoleCodes,
      hasDocumentManage: Boolean(manage),
      permissions: doc.permissions.map((p) => ({
        userId: p.userId,
        roleCode: p.roleCode,
        accessLevel: p.accessLevel,
      })),
    });

    if (!allowed) {
      throw new AppError("DOCUMENT_FORBIDDEN", "Insufficient document permission", 403);
    }

    return doc;
  }

  // Categories
  listCategories() {
    return this.repo.listCategories();
  }

  async createCategory(
    data: { name: string; code: string; description?: string; context?: DocumentContext },
    actorId: string,
  ) {
    const existing = await this.repo.findCategoryByCode(data.code);
    if (existing) {
      throw new AppError("CATEGORY_CODE_EXISTS", "Document category code already exists", 400);
    }
    const category = await this.repo.createCategory(data);
    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "document_category",
      entityId: category.id,
      after: category,
    });
    return category;
  }

  async updateCategory(
    id: string,
    data: Partial<{ name: string; description: string | null; context: DocumentContext | null }>,
    actorId: string,
  ) {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw new AppError("CATEGORY_NOT_FOUND", "Document category not found", 404);
    const updated = await this.repo.updateCategory(id, data);
    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "document_category",
      entityId: id,
      before: existing,
      after: updated,
    });
    return updated;
  }

  async deleteCategory(id: string, actorId: string) {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) throw new AppError("CATEGORY_NOT_FOUND", "Document category not found", 404);
    await this.repo.softDeleteCategory(id);
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "document_category",
      entityId: id,
      before: existing,
    });
    return { id, deleted: true };
  }

  // Documents
  async list(
    filters: {
      search?: string;
      context?: DocumentContext;
      contextEntityId?: string;
      categoryId?: string;
      createdById?: string;
    },
    actorId: string,
  ) {
    const docs = await this.repo.listDocuments(filters);
    const manage = await this.repo.userHasPermissionCode(actorId, "document.manage");
    if (manage) return docs;

    const roleRows = await this.repo.findUserRoleCodes(actorId);
    const actorRoleCodes = roleRows
      .map((r) => r.role.code)
      .filter((c): c is string => Boolean(c));

    return docs.filter((doc) =>
      checkDocumentAccess({
        required: "VIEW",
        createdById: doc.createdById,
        actorId,
        actorRoleCodes,
        hasDocumentManage: false,
        permissions: doc.permissions.map((p) => ({
          userId: p.userId,
          roleCode: p.roleCode,
          accessLevel: p.accessLevel,
        })),
      }),
    );
  }

  async getById(id: string, actorId: string) {
    return this.assertAccess(id, actorId, "VIEW");
  }

  async create(
    data: {
      title: string;
      description?: string;
      categoryId?: string;
      context?: DocumentContext;
      contextEntityId?: string;
      fileId: string;
      changeNotes?: string;
    },
    actorId: string,
  ) {
    const doc = await this.repo.createDocumentWithVersion({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      context: data.context ?? "GENERAL",
      contextEntityId: data.contextEntityId,
      createdById: actorId,
      fileId: data.fileId,
      changeNotes: data.changeNotes,
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "managed_document",
      entityId: doc.id,
      after: { title: data.title, fileId: data.fileId },
    });

    return doc;
  }

  async addVersion(
    id: string,
    data: { fileId: string; changeNotes?: string },
    actorId: string,
  ) {
    await this.assertAccess(id, actorId, "EDIT");
    const doc = await this.repo.addVersion({
      documentId: id,
      fileId: data.fileId,
      uploadedById: actorId,
      changeNotes: data.changeNotes,
    });
    await writeAuditLog({
      userId: actorId,
      action: "add_version",
      entity: "managed_document",
      entityId: id,
      after: { fileId: data.fileId },
    });
    return doc;
  }

  async setPermissions(
    id: string,
    permissions: Array<{
      userId?: string | null;
      roleCode?: string | null;
      accessLevel: DocumentAccessLevel;
    }>,
    actorId: string,
  ) {
    await this.assertAccess(id, actorId, "MANAGE");
    for (const p of permissions) {
      if (!p.userId && !p.roleCode) {
        throw new AppError("INVALID_PERMISSION", "Each permission needs userId or roleCode", 400);
      }
    }
    const rows = await this.repo.setPermissions(id, permissions);
    await writeAuditLog({
      userId: actorId,
      action: "set_permissions",
      entity: "managed_document",
      entityId: id,
      after: { count: rows.length },
    });
    return rows;
  }

  async delete(id: string, actorId: string) {
    await this.assertAccess(id, actorId, "DELETE");
    await this.repo.softDeleteDocument(id);
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "managed_document",
      entityId: id,
    });
    return { id, deleted: true };
  }
}

export const documentService = new DocumentService();
