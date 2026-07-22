import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validate } from "./validate";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
} from "../test/helpers/express-mocks";

describe("validate middleware", () => {
  const bodySchema = z.object({
    email: z.string().email(),
    age: z.coerce.number().int().positive(),
  });

  it("returns 400 with validation errors for invalid body", () => {
    const req = createMockRequest({ body: { email: "not-email", age: -1 } });
    const res = createMockResponse();
    const next = createMockNext();
    const middleware = validate(bodySchema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
        }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("replaces body with parsed/coerced values on success", () => {
    const req = createMockRequest({ body: { email: "test@example.com", age: "25" } });
    const res = createMockResponse();
    const next = createMockNext();
    const middleware = validate(bodySchema);

    middleware(req, res, next);

    expect(req.body).toEqual({ email: "test@example.com", age: 25 });
    expect(next).toHaveBeenCalled();
  });

  it("validates query parameters when target is query", () => {
    const querySchema = z.object({ page: z.coerce.number().int().positive() });
    const req = createMockRequest({ query: { page: "2" } });
    const res = createMockResponse();
    const next = createMockNext();
    const middleware = validate(querySchema, "query");

    middleware(req, res, next);

    expect(req.query).toEqual({ page: 2 });
    expect(next).toHaveBeenCalled();
  });

  it("validates route params when target is params", () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const req = createMockRequest({
      params: { id: "550e8400-e29b-41d4-a716-446655440000" },
    });
    const res = createMockResponse();
    const next = createMockNext();
    const middleware = validate(paramsSchema, "params");

    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 400 for invalid params", () => {
    const paramsSchema = z.object({ id: z.string().uuid() });
    const req = createMockRequest({ params: { id: "not-a-uuid" } });
    const res = createMockResponse();
    const next = createMockNext();
    const middleware = validate(paramsSchema, "params");

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
