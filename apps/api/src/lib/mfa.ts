import crypto from "node:crypto";
import { generateSecret as otplibGenerateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { hashPassword, verifyPassword } from "./password";
import { env } from "./env";

export function generateSecret(): string {
  return otplibGenerateSecret();
}

export async function verifyToken(secret: string, code: string): Promise<boolean> {
  const cleaned = code.replace(/\s+/g, "");
  try {
    const result = await verify({ secret, token: cleaned });
    return Boolean(result && "valid" in result ? result.valid : result);
  } catch {
    return false;
  }
}

export async function buildOtpAuthQr(
  email: string,
  secret: string,
): Promise<{ otpauthUrl: string; qrDataUrl: string }> {
  const issuer = env.MFA_ISSUER;
  const otpauthUrl = generateURI({
    issuer,
    label: email,
    secret,
  });
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrDataUrl };
}

/** Generate N backup codes; returns plaintext codes + bcrypt hashes for storage. */
export async function generateBackupCodes(count = 8): Promise<{
  codes: string[];
  hashes: string[];
}> {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
    hashes.push(await hashPassword(code));
  }
  return { codes, hashes };
}

/** Verify a backup code against stored hashes; returns remaining hashes if used. */
export async function verifyBackupCode(
  code: string,
  hashes: string[],
): Promise<{ ok: boolean; remainingHashes: string[] }> {
  const cleaned = code.replace(/\s+/g, "").toUpperCase();
  for (let i = 0; i < hashes.length; i++) {
    const match = await verifyPassword(cleaned, hashes[i]);
    if (match) {
      return {
        ok: true,
        remainingHashes: hashes.filter((_, idx) => idx !== i),
      };
    }
  }
  return { ok: false, remainingHashes: hashes };
}

export function hashDeviceFingerprint(userAgent: string, ipAddress?: string): string {
  const material = `${userAgent || "unknown"}|${ipAddress || "unknown"}`;
  return crypto.createHash("sha256").update(material).digest("hex");
}
