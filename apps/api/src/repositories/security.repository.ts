import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export type SecurityEventListQuery = {
  userId?: string;
  eventType?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

function buildWhere(query: SecurityEventListQuery): Prisma.SecurityEventWhereInput {
  const where: Prisma.SecurityEventWhereInput = {};

  if (query.userId) where.userId = query.userId;
  if (query.eventType) where.eventType = query.eventType;
  if (query.severity) where.severity = query.severity;

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
      { message: { contains: q, mode: "insensitive" } },
      { eventType: { contains: q, mode: "insensitive" } },
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

export class SecurityEventRepository {
  async list(query: SecurityEventListQuery) {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const where = buildWhere(query);

    const [total, items] = await Promise.all([
      prisma.securityEvent.count({ where }),
      prisma.securityEvent.findMany({
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

export const securityEventRepository = new SecurityEventRepository();
