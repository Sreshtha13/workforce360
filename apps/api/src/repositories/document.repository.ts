import type { DocumentAccessLevel, DocumentContext, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class DocumentRepository {
  createCategory(data: Prisma.DocumentCategoryUncheckedCreateInput) {
    return prisma.documentCategory.create({ data });
  }

  updateCategory(id: string, data: Prisma.DocumentCategoryUncheckedUpdateInput) {
    return prisma.documentCategory.update({ where: { id }, data });
  }

  findCategoryById(id: string) {
    return prisma.documentCategory.findFirst({ where: { id, deletedAt: null } });
  }

  findCategoryByCode(code: string) {
    return prisma.documentCategory.findFirst({ where: { code, deletedAt: null } });
  }

  listCategories() {
    return prisma.documentCategory.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  softDeleteCategory(id: string) {
    return prisma.documentCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createDocumentWithVersion(input: {
    title: string;
    description?: string | null;
    categoryId?: string | null;
    context: DocumentContext;
    contextEntityId?: string | null;
    createdById: string;
    fileId: string;
    changeNotes?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const doc = await tx.managedDocument.create({
        data: {
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          context: input.context,
          contextEntityId: input.contextEntityId,
          createdById: input.createdById,
        },
      });

      const version = await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          versionNumber: 1,
          fileId: input.fileId,
          changeNotes: input.changeNotes ?? "Initial version",
          uploadedById: input.createdById,
        },
      });

      return tx.managedDocument.update({
        where: { id: doc.id },
        data: { currentVersionId: version.id },
        include: {
          versions: { where: { deletedAt: null }, orderBy: { versionNumber: "desc" } },
          permissions: { where: { deletedAt: null } },
          category: true,
          currentVersion: { include: { file: true } },
        },
      });
    });
  }

  async addVersion(input: {
    documentId: string;
    fileId: string;
    uploadedById: string;
    changeNotes?: string | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const latest = await tx.documentVersion.findFirst({
        where: { documentId: input.documentId, deletedAt: null },
        orderBy: { versionNumber: "desc" },
      });
      const versionNumber = (latest?.versionNumber ?? 0) + 1;
      const version = await tx.documentVersion.create({
        data: {
          documentId: input.documentId,
          versionNumber,
          fileId: input.fileId,
          changeNotes: input.changeNotes,
          uploadedById: input.uploadedById,
        },
      });
      return tx.managedDocument.update({
        where: { id: input.documentId },
        data: { currentVersionId: version.id },
        include: {
          versions: { where: { deletedAt: null }, orderBy: { versionNumber: "desc" } },
          permissions: { where: { deletedAt: null } },
          category: true,
          currentVersion: { include: { file: true } },
        },
      });
    });
  }

  findDocumentById(id: string) {
    return prisma.managedDocument.findFirst({
      where: { id, deletedAt: null },
      include: {
        versions: { where: { deletedAt: null }, orderBy: { versionNumber: "desc" } },
        permissions: { where: { deletedAt: null } },
        category: true,
        currentVersion: { include: { file: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  listDocuments(filters: {
    search?: string;
    context?: DocumentContext;
    contextEntityId?: string;
    categoryId?: string;
    createdById?: string;
  }) {
    const where: Prisma.ManagedDocumentWhereInput = { deletedAt: null };
    if (filters.context) where.context = filters.context;
    if (filters.contextEntityId) where.contextEntityId = filters.contextEntityId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.createdById) where.createdById = filters.createdById;
    if (filters.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }
    return prisma.managedDocument.findMany({
      where,
      include: {
        category: true,
        currentVersion: { include: { file: true } },
        permissions: { where: { deletedAt: null } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  softDeleteDocument(id: string) {
    return prisma.managedDocument.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  setPermissions(
    documentId: string,
    permissions: Array<{
      userId?: string | null;
      roleCode?: string | null;
      accessLevel: DocumentAccessLevel;
    }>,
  ) {
    return prisma.$transaction(async (tx) => {
      await tx.documentPermission.updateMany({
        where: { documentId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      if (permissions.length === 0) return [];
      await tx.documentPermission.createMany({
        data: permissions.map((p) => ({
          documentId,
          userId: p.userId,
          roleCode: p.roleCode,
          accessLevel: p.accessLevel,
        })),
      });
      return tx.documentPermission.findMany({
        where: { documentId, deletedAt: null },
      });
    });
  }

  findUserRoleCodes(userId: string) {
    return prisma.userRole.findMany({
      where: { userId, deletedAt: null },
      include: { role: { select: { code: true } } },
    });
  }

  userHasPermissionCode(userId: string, code: string) {
    return prisma.userRole.findFirst({
      where: {
        userId,
        deletedAt: null,
        role: {
          deletedAt: null,
          rolePermissions: {
            some: {
              permission: { code, deletedAt: null },
            },
          },
        },
      },
    });
  }
}
