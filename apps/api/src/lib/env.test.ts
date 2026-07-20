import { describe, it, expect } from "vitest";
import { isAllowedCorsOrigin, corsOrigins, env } from "./env";

describe("CORS origin validation", () => {
  it("allows undefined origin (same-origin requests)", () => {
    expect(isAllowedCorsOrigin(undefined)).toBe(true);
  });

  it("allows origins in the configured whitelist", () => {
    for (const origin of corsOrigins) {
      expect(isAllowedCorsOrigin(origin)).toBe(true);
    }
  });

  it("blocks unknown origins when not in whitelist and dev regex does not apply", () => {
    expect(isAllowedCorsOrigin("https://evil.example.com")).toBe(false);
  });

  it("allows localhost with any port in development mode", () => {
    if (env.NODE_ENV !== "development") {
      return;
    }
    expect(isAllowedCorsOrigin("http://localhost:3001")).toBe(true);
    expect(isAllowedCorsOrigin("http://127.0.0.1:5173")).toBe(true);
  });

  it("uses test NODE_ENV from vitest setup", () => {
    expect(env.NODE_ENV).toBe("test");
  });
});
