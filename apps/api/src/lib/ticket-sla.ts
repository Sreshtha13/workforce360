import type { TicketPriority } from "@prisma/client";

export type SlaMinutes = {
  firstResponseMinutes: number;
  resolutionMinutes: number;
};

/** Compute first-response and resolution due timestamps from a create time + SLA minutes. */
export function calculateSlaDueDates(
  createdAt: Date,
  sla: SlaMinutes,
): { firstResponseDueAt: Date; resolutionDueAt: Date } {
  const firstResponseDueAt = new Date(createdAt.getTime() + sla.firstResponseMinutes * 60_000);
  const resolutionDueAt = new Date(createdAt.getTime() + sla.resolutionMinutes * 60_000);
  return { firstResponseDueAt, resolutionDueAt };
}

const PRIORITY_ALIASES: Record<string, TicketPriority> = {
  low: "LOW",
  medium: "MEDIUM",
  med: "MEDIUM",
  high: "HIGH",
  urgent: "URGENT",
  critical: "URGENT",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
};

export function normalizeTicketPriority(priority?: string | null): TicketPriority {
  if (!priority) return "MEDIUM";
  return PRIORITY_ALIASES[priority] ?? PRIORITY_ALIASES[priority.toLowerCase()] ?? "MEDIUM";
}

/** Generate ticket number: TKT-YYYYMMDD-xxxx (xxxx = random 4 hex). */
export function generateTicketNumber(now = new Date(), suffix?: string): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const seq = (suffix ?? Math.random().toString(16).slice(2, 6).padStart(4, "0")).slice(0, 4);
  return `TKT-${y}${m}${d}-${seq}`;
}
