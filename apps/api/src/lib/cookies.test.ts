import { describe, it, expect } from "vitest";
import { authCookieOptions } from "./cookies";
import { env } from "./env";

describe("authCookieOptions", () => {
  it("returns httpOnly cookies with correct maxAge", () => {
    const maxAge = 900_000;
    const options = authCookieOptions(maxAge);

    expect(options.httpOnly).toBe(true);
    expect(options.maxAge).toBe(maxAge);
    expect(options.path).toBe("/");
  });

  it("uses lax sameSite in non-production environments", () => {
    const options = authCookieOptions(1000);
    if (env.NODE_ENV !== "production") {
      expect(options.sameSite).toBe("lax");
    }
  });

  it("respects COOKIE_SECURE env setting", () => {
    const options = authCookieOptions(1000);
    expect(options.secure).toBe(env.COOKIE_SECURE);
  });
});
