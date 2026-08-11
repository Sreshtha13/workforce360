import type { SupportTicketStatus } from "@prisma/client";

/** All workflow statuses defined in schema.prisma — source of truth when Prisma client lags. */
export const SUPPORT_TICKET_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
] as const;

export type TicketWorkflowStatus = (typeof SUPPORT_TICKET_STATUSES)[number];

export const OPEN_TICKET_STATUSES: TicketWorkflowStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
];

export function toPrismaTicketStatus(status: TicketWorkflowStatus): SupportTicketStatus {
  return status as SupportTicketStatus;
}

export function isTicketWorkflowStatus(status: string): status is TicketWorkflowStatus {
  return (SUPPORT_TICKET_STATUSES as readonly string[]).includes(status);
}
