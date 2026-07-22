import type { Request, Response, NextFunction } from "express";
import { vi } from "vitest";

export function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  } as unknown as Response;

  return res;
}

export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    cookies: {},
    ...overrides,
  } as Request;
}

export function createMockNext(): NextFunction {
  return vi.fn() as NextFunction;
}
