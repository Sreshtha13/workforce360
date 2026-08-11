import { describe, it, expect, vi, beforeEach } from "vitest";
import { requireAuth, optionalAuth } from "./auth";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
} from "../test/helpers/express-mocks";
import { signAccessToken } from "../lib/jwt";

vi.mock("../lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "../lib/prisma";

const mockFindUnique = vi.mocked(prisma.user.findUnique);

function activeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "user@test.com",
    status: "active",
    deletedAt: null,
    sessionVersion: 0,
    userRoles: [],
    ...overrides,
  } as never;
}

describe("requireAuth middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no token is provided", async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "UNAUTHORIZED" }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("accepts token from Authorization header", async () => {
    const token = signAccessToken("user-1", "user@test.com", 0);
    const req = createMockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = createMockResponse();
    const next = createMockNext();

    mockFindUnique.mockResolvedValue(activeUser());

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user?.userId).toBe("user-1");
  });

  it("accepts token from cookie", async () => {
    const token = signAccessToken("user-1", "user@test.com", 0);
    const req = createMockRequest({
      cookies: { accessToken: token },
    });
    const res = createMockResponse();
    const next = createMockNext();

    mockFindUnique.mockResolvedValue(activeUser());

    await requireAuth(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 401 for deleted users", async () => {
    const token = signAccessToken("user-1", "user@test.com", 0);
    const req = createMockRequest({
      cookies: { accessToken: token },
    });
    const res = createMockResponse();
    const next = createMockNext();

    mockFindUnique.mockResolvedValue(
      activeUser({ deletedAt: new Date() }),
    );

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 for inactive users", async () => {
    const token = signAccessToken("user-1", "user@test.com", 0);
    const req = createMockRequest({
      cookies: { accessToken: token },
    });
    const res = createMockResponse();
    const next = createMockNext();

    mockFindUnique.mockResolvedValue(activeUser({ status: "inactive" }));

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when session version mismatches", async () => {
    const token = signAccessToken("user-1", "user@test.com", 0);
    const req = createMockRequest({
      cookies: { accessToken: token },
    });
    const res = createMockResponse();
    const next = createMockNext();

    mockFindUnique.mockResolvedValue(activeUser({ sessionVersion: 2 }));

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "SESSION_EXPIRED" }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("deduplicates and filters inactive permissions", async () => {
    const token = signAccessToken("user-1", "user@test.com", 0);
    const req = createMockRequest({
      cookies: { accessToken: token },
    });
    const res = createMockResponse();
    const next = createMockNext();

    mockFindUnique.mockResolvedValue(
      activeUser({
        userRoles: [
          {
            role: {
              code: "admin",
              rolePermissions: [
                { permission: { code: "user.read", isActive: true } },
                { permission: { code: "user.read", isActive: true } },
                { permission: { code: "user.delete", isActive: false } },
              ],
            },
          },
        ],
      }),
    );

    await requireAuth(req, res, next);

    expect(req.user?.permissions).toEqual(["user.read"]);
    expect(req.user?.roles).toEqual(["admin"]);
    expect(next).toHaveBeenCalled();
  });

  it("returns 401 for invalid JWT", async () => {
    const req = createMockRequest({
      cookies: { accessToken: "invalid-token" },
    });
    const res = createMockResponse();
    const next = createMockNext();

    await requireAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe("optionalAuth middleware", () => {
  it("continues without user when no token", () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const next = createMockNext();

    optionalAuth(req, res, next);

    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it("attaches payload when token is valid", () => {
    const token = signAccessToken("user-1", "user@test.com", 0);
    const req = createMockRequest({
      cookies: { accessToken: token },
    });
    const res = createMockResponse();
    const next = createMockNext();

    optionalAuth(req, res, next);

    expect(req.user?.userId).toBe("user-1");
    expect(next).toHaveBeenCalled();
  });
});
