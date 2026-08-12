/** Phase 9 — Notifications & announcements (backend is source of truth). */

export type NotificationCategory =
  | "TICKET"
  | "APPROVAL"
  | "LEAVE"
  | "PAYROLL"
  | "FINANCE"
  | "HR"
  | "ANNOUNCEMENT"
  | "SYSTEM"
  | "DOCUMENT";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory | string;
  isRead: boolean;
  link?: string | null;
  createdAt: string;
};

export type NotificationPreference = {
  id: string;
  userId: string;
  category: NotificationCategory | string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedById: string;
  publishedAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  publishedBy?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type CreateAnnouncementInput = {
  title: string;
  body: string;
  audience?: string;
  expiresAt?: string;
};

export type UpdateAnnouncementInput = {
  title?: string;
  body?: string;
  audience?: string;
  expiresAt?: string | null;
  isActive?: boolean;
};

export type UpdatePreferenceInput = {
  category: NotificationCategory;
  inAppEnabled: boolean;
  emailEnabled: boolean;
};

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "TICKET",
  "APPROVAL",
  "LEAVE",
  "PAYROLL",
  "FINANCE",
  "HR",
  "ANNOUNCEMENT",
  "SYSTEM",
  "DOCUMENT",
];
