import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

export type SecurityEventInput = {
  userId?: string | null;
  eventType: string;
  severity?: "INFO" | "WARN" | "CRITICAL";
  message: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

/** In-memory rate limit: max 1 PERMISSION_DENIED write per user+path per minute. */
const permissionDeniedThrottle = new Map<string, number>();

export async function recordSecurityEvent(input: SecurityEventInput): Promise<void> {
  try {
    await prisma.securityEvent.create({
      data: {
        userId: input.userId ?? null,
        eventType: input.eventType,
        severity: input.severity ?? "INFO",
        message: input.message,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch (err) {
    console.error("[security-monitor] failed to write event", err);
  }
}

export async function recordFailedLogin(opts: {
  email?: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  lockoutThreshold?: number;
}): Promise<void> {
  const threshold = opts.lockoutThreshold ?? 5;
  const since = new Date(Date.now() - 15 * 60 * 1000);

  await recordSecurityEvent({
    userId: opts.userId,
    eventType: "FAILED_LOGIN",
    severity: "WARN",
    message: `Failed login attempt for ${opts.email ?? "unknown"}`,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    metadata: { email: opts.email },
  });

  const whereIp = opts.ipAddress
    ? { ipAddress: opts.ipAddress, eventType: "FAILED_LOGIN", createdAt: { gte: since } }
    : null;
  const whereEmail =
    opts.email
      ? {
          eventType: "FAILED_LOGIN",
          createdAt: { gte: since },
          // metadata filter via raw-ish: count by message contains email
        }
      : null;

  let count = 0;
  if (whereIp) {
    count = await prisma.securityEvent.count({ where: whereIp });
  } else if (opts.userId) {
    count = await prisma.securityEvent.count({
      where: {
        userId: opts.userId,
        eventType: "FAILED_LOGIN",
        createdAt: { gte: since },
      },
    });
  }

  // Also count by email metadata when IP missing
  if (!whereIp && opts.email) {
    const recent = await prisma.securityEvent.findMany({
      where: {
        eventType: "FAILED_LOGIN",
        createdAt: { gte: since },
      },
      select: { metadata: true },
      take: 100,
    });
    count = Math.max(
      count,
      recent.filter((e) => {
        const meta = e.metadata as { email?: string } | null;
        return meta?.email === opts.email;
      }).length,
    );
  }

  if (count >= threshold) {
    const msg = `CRITICAL: ${count} failed logins in 15m (ip=${opts.ipAddress ?? "n/a"}, email=${opts.email ?? "n/a"})`;
    console.error(`[security-alert] ${msg}`);
    await recordSecurityEvent({
      userId: opts.userId,
      eventType: "SUSPICIOUS",
      severity: "CRITICAL",
      message: msg,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      metadata: { email: opts.email, count, windowMinutes: 15 },
    });
  }

  void whereEmail;
}

export async function recordPermissionDenied(opts: {
  userId: string;
  path: string;
  method?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  required?: string[];
}): Promise<void> {
  const key = `${opts.userId}:${opts.path}`;
  const now = Date.now();
  const last = permissionDeniedThrottle.get(key) ?? 0;
  if (now - last < 60_000) return;
  permissionDeniedThrottle.set(key, now);

  // Prune old throttle entries occasionally
  if (permissionDeniedThrottle.size > 5000) {
    for (const [k, ts] of permissionDeniedThrottle) {
      if (now - ts > 60_000) permissionDeniedThrottle.delete(k);
    }
  }

  await recordSecurityEvent({
    userId: opts.userId,
    eventType: "PERMISSION_DENIED",
    severity: "WARN",
    message: `Permission denied on ${opts.method ?? "?"} ${opts.path}`,
    ipAddress: opts.ipAddress,
    userAgent: opts.userAgent,
    metadata: { path: opts.path, required: opts.required },
  });
}
