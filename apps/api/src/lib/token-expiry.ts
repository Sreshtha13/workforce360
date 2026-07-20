import { env } from "./env";

const DURATION_PATTERN = /^(\d+)([smhd])$/;

/** Parse JWT-style durations such as `15m` or `30d` into milliseconds. */
export function parseDurationToMs(duration: string): number {
  const match = DURATION_PATTERN.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid duration unit: ${unit}`);
  }
}

export function getAccessTokenMaxAgeMs(): number {
  return parseDurationToMs(env.JWT_ACCESS_EXPIRES_IN);
}

export function getRefreshTokenMaxAgeMs(): number {
  return parseDurationToMs(env.JWT_REFRESH_EXPIRES_IN);
}

export function getRefreshTokenExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + getRefreshTokenMaxAgeMs());
}
