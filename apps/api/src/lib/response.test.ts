import { describe, it, expect } from "vitest";
import { sendSuccess, sendError } from "./response";
import { createMockResponse } from "../test/helpers/express-mocks";

describe("API response helpers", () => {
  it("sendSuccess returns data envelope with default 200 status", () => {
    const res = createMockResponse();
    const data = { id: "1", name: "Test" };

    sendSuccess(res, data);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      data,
      error: null,
      meta: null,
    });
  });

  it("sendSuccess accepts custom status and meta", () => {
    const res = createMockResponse();
    const meta = { page: 1, total: 10 };

    sendSuccess(res, [], 201, meta);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      data: [],
      error: null,
      meta,
    });
  });

  it("sendError returns error envelope", () => {
    const res = createMockResponse();
    const error = {
      code: "NOT_FOUND",
      message: "Resource not found",
    };

    sendError(res, 404, error);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      data: null,
      error,
      meta: null,
    });
  });

  it("sendError includes details when provided", () => {
    const res = createMockResponse();
    const error = {
      code: "FORBIDDEN",
      message: "Insufficient permissions",
      details: { required: ["user.read"], actual: [] },
    };

    sendError(res, 403, error);

    expect(res.json).toHaveBeenCalledWith({
      data: null,
      error,
      meta: null,
    });
  });
});
