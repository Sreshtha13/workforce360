import { z } from "zod";

export const notificationCategorySchema = z.enum([
  "TICKET",
  "APPROVAL",
  "LEAVE",
  "PAYROLL",
  "FINANCE",
  "HR",
  "ANNOUNCEMENT",
  "SYSTEM",
  "DOCUMENT",
]);

export const listNotificationsQuerySchema = z.object({
  unreadOnly: z.enum(["true", "false"]).optional(),
  category: notificationCategorySchema.optional(),
});

export const updatePreferenceSchema = z.object({
  category: notificationCategorySchema,
  inAppEnabled: z.boolean(),
  emailEnabled: z.boolean(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(10000),
  audience: z.string().max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(10000).optional(),
  audience: z.string().max(100).optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
});
