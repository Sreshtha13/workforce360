import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { KnowledgeBaseRepository } from "../repositories/knowledge-base.repository";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

export class KnowledgeBaseService {
  private repo = new KnowledgeBaseRepository();

  list(filters?: { publishedOnly?: boolean; category?: string; search?: string }) {
    return this.repo.list(filters);
  }

  async getById(id: string, opts?: { incrementView?: boolean }) {
    const article = await this.repo.findById(id);
    if (!article) throw new AppError("KB_NOT_FOUND", "Knowledge base article not found", 404);
    if (opts?.incrementView) {
      await this.repo.incrementViewCount(id);
    }
    return article;
  }

  async create(
    data: {
      title: string;
      content: string;
      category?: string;
      tags?: string[];
      slug?: string;
      isPublished?: boolean;
    },
    authorId: string,
  ) {
    const slug = data.slug?.trim() || slugify(data.title);
    const existing = await this.repo.findBySlug(slug);
    if (existing) {
      throw new AppError("KB_SLUG_EXISTS", "An article with this slug already exists", 400);
    }

    const article = await this.repo.create({
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags ?? [],
      slug,
      isPublished: data.isPublished ?? false,
      authorId,
    });

    await writeAuditLog({
      userId: authorId,
      action: "create",
      entity: "knowledge_base_article",
      entityId: article.id,
      after: article,
    });

    return article;
  }

  async update(
    id: string,
    data: Partial<{
      title: string;
      content: string;
      category: string | null;
      tags: string[];
      slug: string;
      isPublished: boolean;
    }>,
    actorId: string,
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("KB_NOT_FOUND", "Knowledge base article not found", 404);

    if (data.slug && data.slug !== existing.slug) {
      const conflict = await this.repo.findBySlug(data.slug);
      if (conflict) {
        throw new AppError("KB_SLUG_EXISTS", "An article with this slug already exists", 400);
      }
    }

    const updated = await this.repo.update(id, data);
    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "knowledge_base_article",
      entityId: id,
      before: existing,
      after: updated,
    });
    return updated;
  }

  async delete(id: string, actorId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new AppError("KB_NOT_FOUND", "Knowledge base article not found", 404);
    await this.repo.softDelete(id);
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "knowledge_base_article",
      entityId: id,
      before: existing,
    });
    return { id, deleted: true };
  }
}

export const knowledgeBaseService = new KnowledgeBaseService();
