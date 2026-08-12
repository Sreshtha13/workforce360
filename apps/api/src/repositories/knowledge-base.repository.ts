import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class KnowledgeBaseRepository {
  create(data: Prisma.KnowledgeBaseArticleUncheckedCreateInput) {
    return prisma.knowledgeBaseArticle.create({ data });
  }

  update(id: string, data: Prisma.KnowledgeBaseArticleUncheckedUpdateInput) {
    return prisma.knowledgeBaseArticle.update({ where: { id }, data });
  }

  findById(id: string) {
    return prisma.knowledgeBaseArticle.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  findBySlug(slug: string) {
    return prisma.knowledgeBaseArticle.findFirst({
      where: { slug, deletedAt: null },
    });
  }

  list(filters?: { publishedOnly?: boolean; category?: string; search?: string }) {
    const where: Prisma.KnowledgeBaseArticleWhereInput = { deletedAt: null };
    if (filters?.publishedOnly) where.isPublished = true;
    if (filters?.category) where.category = filters.category;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { content: { contains: q, mode: "insensitive" } },
      ];
    }
    return prisma.knowledgeBaseArticle.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  softDelete(id: string) {
    return prisma.knowledgeBaseArticle.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  }

  incrementViewCount(id: string) {
    return prisma.knowledgeBaseArticle.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }
}
