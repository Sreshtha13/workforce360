import { describe, it, expect } from "vitest";
import { requireSelfOrPermission, requireAnyPermission } from "./ownership";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
} from "../test/helpers/express-mocks";

describe("ownership middleware", () => {
  describe("requireSelfOrPermission", () => {
    it("allows access to own resource without the permission", () => {
      const req = createMockRequest({ params: { id: "user-1" } });
      req.user = {
        userId: "user-1",
        email: "a@b.com",
        type: "access",
        permissions: [],
      };
      const res = createMockResponse();
      const next = createMockNext();

      requireSelfOrPermission("user.read")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("allows access to another user with user.read", () => {
      const req = createMockRequest({ params: { id: "user-2" } });
      req.user = {
        userId: "user-1",
        email: "a@b.com",
        type: "access",
        permissions: ["user.read"],
      };
      const res = createMockResponse();
      const next = createMockNext();

      requireSelfOrPermission("user.read")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("denies access to another user without permission", () => {
      const req = createMockRequest({ params: { id: "user-2" } });
      req.user = {
        userId: "user-1",
        email: "a@b.com",
        type: "access",
        permissions: ["portal.read"],
      };
      const res = createMockResponse();
      const next = createMockNext();

      requireSelfOrPermission("user.read")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireAnyPermission", () => {
    it("allows when any listed permission matches", () => {
      const req = createMockRequest();
      req.user = {
        userId: "1",
        email: "a@b.com",
        type: "access",
        permissions: ["ticket.create"],
      };
      const res = createMockResponse();
      const next = createMockNext();

      requireAnyPermission("ticket.create", "portal.read")(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("denies when none match", () => {
      const req = createMockRequest();
      req.user = {
        userId: "1",
        email: "a@b.com",
        type: "access",
        permissions: ["portal.read"],
      };
      const res = createMockResponse();
      const next = createMockNext();

      requireAnyPermission("ticket.manage", "policy.create")(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
