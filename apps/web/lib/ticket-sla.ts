/** Shared helpers for ticket SLA display. */

export function ticketDisplayNumber(ticket: {
  ticketNumber?: string | null;
  id: string;
}): string {
  if (ticket.ticketNumber?.trim()) return ticket.ticketNumber;
  return ticket.id.slice(-8).toUpperCase();
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type SlaCountdown = {
  label: string;
  overdue: boolean;
  remainingMs: number;
};

export function slaCountdown(dueAt?: string | null, completedAt?: string | null): SlaCountdown | null {
  if (!dueAt) return null;
  if (completedAt) {
    return { label: "Met", overdue: false, remainingMs: 0 };
  }
  const due = new Date(dueAt).getTime();
  if (Number.isNaN(due)) return null;
  const remainingMs = due - Date.now();
  if (remainingMs <= 0) {
    const overdueMins = Math.round(Math.abs(remainingMs) / 60000);
    return {
      label: overdueMins >= 60 ? `${Math.floor(overdueMins / 60)}h overdue` : `${overdueMins}m overdue`,
      overdue: true,
      remainingMs,
    };
  }
  const mins = Math.round(remainingMs / 60000);
  if (mins >= 60 * 24) {
    return { label: `${Math.floor(mins / (60 * 24))}d left`, overdue: false, remainingMs };
  }
  if (mins >= 60) {
    return { label: `${Math.floor(mins / 60)}h left`, overdue: false, remainingMs };
  }
  return { label: `${mins}m left`, overdue: false, remainingMs };
}

export function priorityLabel(priority: string): string {
  return priority.replace(/_/g, " ").toLowerCase();
}
