import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

/** Optional pagination — omit page/pageSize to return full result sets (backward compatible). */
export const optionalPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type OptionalPaginationQuery = z.infer<typeof optionalPaginationQuerySchema>;

export function resolveOptionalPagination(query: OptionalPaginationQuery): PaginationQuery | null {
  if (query.page === undefined && query.pageSize === undefined) {
    return null;
  }
  return {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 25,
  };
}

export function paginationArgs(query: PaginationQuery): { skip: number; take: number } {
  const skip = (query.page - 1) * query.pageSize;
  return { skip, take: query.pageSize };
}

export function paginationMeta(query: PaginationQuery, total: number) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize) || 1,
  };
}
