import type { CookieOptions } from "express";
import { env } from "./env";

/** Cookie options for JWT tokens — lax in dev so cross-port localhost works (3001 → 4000). */
export function authCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.NODE_ENV === "production" ? "strict" : "lax",
    path: "/",
    maxAge: maxAgeMs,
  };
}
