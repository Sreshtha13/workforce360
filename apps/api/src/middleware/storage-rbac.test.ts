import { describe, it, expect } from "vitest";
import {
  requireStoragePurposePermission,
  STORAGE_PURPOSE_PERMISSIONS,
} from "./storage-rbac";
import {
  createMockRequest,
  createMockResponse,
  createMockNext,
} from "../test/helpers/express-mocks";

describe("requireStoragePurposePermission", () => {
  it("returns 401 when unauthenticated", () => {
    const req = createMockRequest({ body: { purpose: "RESUME" } });
    const res = createMockResponse();
    const next = createMockNext();

    requireStoragePurposePermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 when purpose is missing", () => {
    const req = createMockRequest({ body: {} });
    req.user = {
      userId: "1",
      email: "a@b.com",
      type: "access",
      permissions: ["portal.read"],
    };
    const res = createMockResponse();
    const next = createMockNext();

    requireStoragePurposePermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 400 for unsupported purpose", () => {
    const req = createMockRequest({ body: { purpose: "MALWARE" } });
    req.user = {
      userId: "1",
      email: "a@b.com",
      type: "access",
      permissions: ["portal.read"],
    };
    const res = createMockResponse();
    const next = createMockNext();

    requireStoragePurposePermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows POLICY upload with policy.create", () => {
    const req = createMockRequest({ body: { purpose: "POLICY" } });
    req.user = {
      userId: "1",
      email: "hr@b.com",
      type: "access",
      permissions: ["policy.create"],
    };
    const res = createMockResponse();
    const next = createMockNext();

    requireStoragePurposePermission(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("denies POLICY upload with only portal.read", () => {
    const req = createMockRequest({ body: { purpose: "POLICY" } });
    req.user = {
      userId: "1",
      email: "emp@b.com",
      type: "access",
      permissions: ["portal.read"],
    };
    const res = createMockResponse();
    const next = createMockNext();

    requireStoragePurposePermission(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows RESUME upload with portal.read", () => {
    const req = createMockRequest({ body: { purpose: "RESUME" } });
    req.user = {
      userId: "1",
      email: "cand@b.com",
      type: "access",
      permissions: ["portal.read"],
    };
    const res = createMockResponse();
    const next = createMockNext();

    requireStoragePurposePermission(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("maps every declared purpose to at least one permission", () => {
    for (const [purpose, perms] of Object.entries(STORAGE_PURPOSE_PERMISSIONS)) {
      expect(perms.length, purpose).toBeGreaterThan(0);
    }
  });
});
