/** Shared status → badge-variant mappings for Finance & Payroll admin UI. */

export type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "outline"
  | "soft";

export function invoiceStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "PAID":
      return "success";
    case "PARTIALLY_PAID":
      return "info";
    case "SENT":
    case "APPROVED":
      return "info";
    case "PENDING_APPROVAL":
      return "warning";
    case "OVERDUE":
    case "REJECTED":
      return "destructive";
    case "CANCELLED":
      return "soft";
    default:
      return "secondary";
  }
}

export function reimbursementStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "APPROVED":
      return "info";
    case "PAID":
      return "success";
    case "REJECTED":
      return "destructive";
    default:
      return "warning";
  }
}

export function salaryRevisionStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "destructive";
    default:
      return "warning";
  }
}

export function payrollRunStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "PAID":
      return "success";
    case "PROCESSED":
    case "APPROVED":
      return "info";
    case "PENDING_APPROVAL":
      return "warning";
    case "CANCELLED":
      return "destructive";
    default:
      return "secondary";
  }
}

export function paymentStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "SUCCEEDED":
      return "success";
    case "PENDING":
      return "warning";
    case "FAILED":
      return "destructive";
    case "REFUNDED":
      return "soft";
    default:
      return "secondary";
  }
}

export function formatMoney(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
