import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("otplib", () => ({
  generateSecret: () => "JBSWY3DPEHPK3PXP",
  generateURI: () => "otpauth://totp/test",
  verify: vi.fn(async ({ token }: { token: string }) => ({
    valid: token === "123456",
    delta: 0,
  })),
}));

vi.mock("qrcode", () => ({
  default: { toDataURL: vi.fn(async () => "data:image/png;base64,xx") },
}));

vi.mock("./password", () => ({
  hashPassword: vi.fn(async (p: string) => `hash:${p}`),
  verifyPassword: vi.fn(async (p: string, hash: string) => hash === `hash:${p}`),
}));

vi.mock("./env", () => ({
  env: { MFA_ISSUER: "Workforce360" },
}));

import { verifyToken, generateBackupCodes, verifyBackupCode } from "./mfa";

describe("mfa helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("verifyToken accepts a valid mock code", async () => {
    expect(await verifyToken("JBSWY3DPEHPK3PXP", "123456")).toBe(true);
    expect(await verifyToken("JBSWY3DPEHPK3PXP", "000000")).toBe(false);
  });

  it("generateBackupCodes returns plaintext + hashes", async () => {
    const { codes, hashes } = await generateBackupCodes(2);
    expect(codes).toHaveLength(2);
    expect(hashes).toHaveLength(2);
    expect(hashes[0]).toMatch(/^hash:/);
  });

  it("verifyBackupCode consumes a matching hash", async () => {
    const hashes = ["hash:ABCD1234", "hash:OTHER"];
    const ok = await verifyBackupCode("ABCD1234", hashes);
    expect(ok.ok).toBe(true);
    expect(ok.remainingHashes).toEqual(["hash:OTHER"]);
  });
});
