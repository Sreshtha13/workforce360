import { describe, it, expect } from "vitest";
import { checkDocumentAccess } from "../lib/document-access";

describe("document permission check", () => {
  const basePerms = [
    { userId: "u2", roleCode: null, accessLevel: "VIEW" as const },
    { userId: null, roleCode: "hr", accessLevel: "EDIT" as const },
  ];

  it("allows creator and document.manage bypass", () => {
    expect(
      checkDocumentAccess({
        required: "DELETE",
        createdById: "creator",
        actorId: "creator",
        actorRoleCodes: [],
        hasDocumentManage: false,
        permissions: [],
      }),
    ).toBe(true);

    expect(
      checkDocumentAccess({
        required: "MANAGE",
        createdById: "creator",
        actorId: "other",
        actorRoleCodes: [],
        hasDocumentManage: true,
        permissions: [],
      }),
    ).toBe(true);
  });

  it("enforces access level ranks for users and roles", () => {
    expect(
      checkDocumentAccess({
        required: "VIEW",
        createdById: "creator",
        actorId: "u2",
        actorRoleCodes: [],
        hasDocumentManage: false,
        permissions: basePerms,
      }),
    ).toBe(true);

    expect(
      checkDocumentAccess({
        required: "EDIT",
        createdById: "creator",
        actorId: "u2",
        actorRoleCodes: [],
        hasDocumentManage: false,
        permissions: basePerms,
      }),
    ).toBe(false);

    expect(
      checkDocumentAccess({
        required: "EDIT",
        createdById: "creator",
        actorId: "u3",
        actorRoleCodes: ["hr"],
        hasDocumentManage: false,
        permissions: basePerms,
      }),
    ).toBe(true);
  });
});
