import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export type AuditLogListQuery = {
  userId?: string;
  entity?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export function buildAuditLogWhere(query: AuditLogListQuery): Prisma.AuditLogWhereInput {
  const where: Prisma.AuditLogWhereInput = {};

  if (query.userId) where.userId = query.userId;
  if (query.entity) where.entity = query.entity;
  if (query.action) where.action = query.action;

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }

  if (query.search?.trim()) {
    const q = query.search.trim();
    where.OR = [
      { entity: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      {
        user: {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  return where;
}

export class AuditLogRepository {
  async list(query: AuditLogListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const where = buildAuditLogWhere(query);

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }
}

export const auditLogRepository = new AuditLogRepository();
