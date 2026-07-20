import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "./env";

export type JwtPayload = {
  userId: string;
  email: string;
  type: "access" | "refresh";
  sessionVersion: number;
  jti?: string;
};

export function signAccessToken(
  userId: string,
  email: string,
  sessionVersion: number,
): string {
  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  const payload: JwtPayload = {
    userId,
    email,
    type: "access",
    sessionVersion,
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });
}

export function signRefreshToken(
  userId: string,
  email: string,
  sessionVersion: number,
): string {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  const payload: JwtPayload = {
    userId,
    email,
    type: "refresh",
    sessionVersion,
    jti: crypto.randomUUID(),
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  if (!env.JWT_ACCESS_SECRET) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    if (payload.type !== "access") {
      throw new Error("Invalid token type");
    }
    return payload;
  } catch {
    throw new Error("Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): JwtPayload {
  if (!env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    if (payload.type !== "refresh") {
      throw new Error("Invalid token type");
    }
    return payload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }
}
