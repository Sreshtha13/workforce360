import { describe, it, expect, vi } from "vitest";
import { ZodError, z } from "zod";
import { AppError } from "../lib/app-error";
import { notFoundHandler, errorHandler } from "./error-handler";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
} from "../test/helpers/express-mocks";

describe("error handlers", () => {
  it("notFoundHandler returns 404 NOT_FOUND", () => {
    const req = createMockRequest();
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      error: { code: "NOT_FOUND", message: "Route not found" },
      meta: null,
    });
  });

  it("errorHandler maps ZodError to 400 VALIDATION_ERROR", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({});
    const zodError = result.success ? new ZodError([]) : result.error;

    errorHandler(zodError, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("errorHandler maps AppError to its status and code", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    errorHandler(
      new AppError("DUPLICATE_EMPLOYEE_ID", "Conflict", 409),
      req,
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      error: {
        code: "DUPLICATE_EMPLOYEE_ID",
        message: "Conflict",
      },
      meta: null,
    });
  });

  it("errorHandler maps unknown errors to 500 INTERNAL_ERROR", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    errorHandler(new Error("Unexpected"), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
      meta: null,
    });

    consoleSpy.mockRestore();
  });
});
