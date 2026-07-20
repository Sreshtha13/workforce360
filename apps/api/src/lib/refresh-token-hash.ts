import crypto from "crypto";

/** Store only a SHA-256 hash of refresh tokens — never the raw JWT. */
export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
