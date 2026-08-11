import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { AppError, mapPrismaError } from "./app-error";

describe("mapPrismaError", () => {
  it("maps duplicate employee_id constraint to DUPLICATE_EMPLOYEE_ID", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "6.0.0",
      meta: { target: ["employee_id"] },
    });

    const mapped = mapPrismaError(error);
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped?.code).toBe("DUPLICATE_EMPLOYEE_ID");
    expect(mapped?.statusCode).toBe(409);
    expect(mapped?.message).not.toContain("prisma");
  });

  it("maps duplicate employee_code constraint to DUPLICATE_EMPLOYEE_CODE", () => {
    const error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "6.0.0",
      meta: { target: ["employee_code"] },
    });

    const mapped = mapPrismaError(error);
    expect(mapped?.code).toBe("DUPLICATE_EMPLOYEE_CODE");
  });

  it("returns null for unrelated errors", () => {
    expect(mapPrismaError(new Error("nope"))).toBeNull();
  });
});
