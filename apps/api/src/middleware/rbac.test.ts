import { describe, it, expect } from "vitest";
import { requirePermission, requireAllPermissions } from "./rbac";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
} from "../test/helpers/express-mocks";

describe("RBAC middleware", () => {
  describe("requirePermission (OR logic)", () => {
    it("returns 401 when user is not authenticated", () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = requirePermission("user.read");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("allows access when user has one of required permissions", () => {
      const req = createMockRequest();
      req.user = {
        userId: "1",
        email: "a@b.com",
        type: "access",
        permissions: ["user.read"],
      };
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = requirePermission("user.read", "user.create");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("returns 403 when user lacks all required permissions", () => {
      const req = createMockRequest();
      req.user = {
        userId: "1",
        email: "a@b.com",
        type: "access",
        permissions: ["user.read"],
      };
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = requirePermission("user.delete", "role.delete");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: "FORBIDDEN",
            details: {
              required: ["user.delete", "role.delete"],
              actual: ["user.read"],
            },
          }),
        }),
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireAllPermissions (AND logic)", () => {
    it("returns 401 when user is not authenticated", () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = requireAllPermissions("user.read");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("allows access when user has all required permissions", () => {
      const req = createMockRequest();
      req.user = {
        userId: "1",
        email: "a@b.com",
        type: "access",
        permissions: ["user.read", "user.update"],
      };
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = requireAllPermissions("user.read", "user.update");

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("returns 403 when user has only some required permissions", () => {
      const req = createMockRequest();
      req.user = {
        userId: "1",
        email: "a@b.com",
        type: "access",
        permissions: ["user.read"],
      };
      const res = createMockResponse();
      const next = createMockNext();
      const middleware = requireAllPermissions("user.read", "user.update");

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
