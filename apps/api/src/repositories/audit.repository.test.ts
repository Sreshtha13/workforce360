import { describe, expect, it } from "vitest";
import { buildAuditLogWhere } from "../repositories/audit.repository";

describe("buildAuditLogWhere", () => {
  it("applies scalar filters", () => {
    const where = buildAuditLogWhere({
      userId: "u1",
      entity: "invoice",
      action: "create",
    });
    expect(where).toMatchObject({
      userId: "u1",
      entity: "invoice",
      action: "create",
    });
  });

  it("builds date range and search OR", () => {
    const where = buildAuditLogWhere({
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
      search: "pay",
    });
    expect(where.createdAt).toBeDefined();
    expect(where.OR).toBeDefined();
    expect(Array.isArray(where.OR)).toBe(true);
  });
});
