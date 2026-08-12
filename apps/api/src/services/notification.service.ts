import type { NotificationCategory } from "@prisma/client";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { sendEmail } from "../lib/email";
import { prisma } from "../lib/prisma";
import { renderTemplate } from "../lib/template-render";
import { NotificationRepository } from "../repositories/notification.repository";

/** Whether email should be sent given preference (missing pref = opt-in). */
export function shouldSendEmail(
  preference: { emailEnabled: boolean } | null | undefined,
): boolean {
  if (!preference) return true;
  return preference.emailEnabled;
}

/** Whether in-app notification should be created (missing pref = opt-in). */
export function shouldCreateInApp(
  preference: { inAppEnabled: boolean } | null | undefined,
): boolean {
  if (!preference) return true;
  return preference.inAppEnabled;
}

export class NotificationService {
  private repo = new NotificationRepository();

  async createInApp(
    input: {
      userId: string;
      title: string;
      message: string;
      category?: NotificationCategory;
      link?: string;
      sendEmail?: boolean;
      /** Optional notification template code (e.g. ticket_assigned). Falls back to title/message. */
      templateCode?: string;
      templateVars?: Record<string, string>;
    },
    actorId?: string,
  ) {
    const category = input.category ?? "SYSTEM";
    const preference = await this.repo.findPreference(input.userId, category);

    if (!shouldCreateInApp(preference)) {
      return null;
    }

    const notification = await this.repo.create({
      userId: input.userId,
      title: input.title,
      message: input.message,
      category,
      link: input.link,
    });

    const wantsEmail = input.sendEmail !== false && shouldSendEmail(preference);
    if (wantsEmail) {
      const user = await this.repo.findUserEmail(input.userId);
      if (user?.email) {
        let subject = input.title;
        let text = input.message;

        if (input.templateCode) {
          try {
            const tpl = await prisma.notificationTemplate.findFirst({
              where: {
                code: input.templateCode,
                deletedAt: null,
                isActive: true,
              },
            });
            if (tpl) {
              subject = renderTemplate(tpl.subject ?? subject, input.templateVars ?? {}) || subject;
              text = renderTemplate(tpl.body, input.templateVars ?? {}) || text;
            }
          } catch {
            // graceful fallback to hardcoded title/message
          }
        }

        const result = await sendEmail({
          to: user.email,
          subject,
          text,
          html: `<p>${text.replace(/\n/g, "<br/>")}</p>`,
        });
        if (result.mode === "smtp" || result.mode === "console") {
          await this.repo.updateEmailSentAt(notification.id, new Date());
        }
      }
    }

    if (actorId) {
      await writeAuditLog({
        userId: actorId,
        action: "create",
        entity: "notification",
        entityId: notification.id,
        after: { userId: input.userId, category },
      });
    }

    return notification;
  }

  list(userId: string, opts?: { unreadOnly?: boolean; category?: NotificationCategory }) {
    return this.repo.listForUser(userId, opts);
  }

  unreadCount(userId: string) {
    return this.repo.countUnread(userId);
  }

  async markRead(id: string, userId: string) {
    const result = await this.repo.markRead(id, userId);
    if (result.count === 0) {
      throw new AppError("NOTIFICATION_NOT_FOUND", "Notification not found", 404);
    }
    return { id, isRead: true };
  }

  async markAllRead(userId: string) {
    const result = await this.repo.markAllRead(userId);
    return { updated: result.count };
  }

  getPreferences(userId: string) {
    return this.repo.listPreferences(userId);
  }

  async updatePreference(
    userId: string,
    data: { category: NotificationCategory; inAppEnabled: boolean; emailEnabled: boolean },
    actorId: string,
  ) {
    const pref = await this.repo.upsertPreference({
      userId,
      category: data.category,
      inAppEnabled: data.inAppEnabled,
      emailEnabled: data.emailEnabled,
    });

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "notification_preference",
      entityId: pref.id,
      after: pref,
    });

    return pref;
  }

  async createAnnouncement(
    data: { title: string; body: string; audience?: string; expiresAt?: string },
    actorId: string,
  ) {
    const announcement = await this.repo.createAnnouncement({
      title: data.title,
      body: data.body,
      publishedById: actorId,
      audience: data.audience ?? "ALL",
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      isActive: true,
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "announcement",
      entityId: announcement.id,
      after: announcement,
    });

    return announcement;
  }

  async updateAnnouncement(
    id: string,
    data: Partial<{ title: string; body: string; audience: string; expiresAt: string | null; isActive: boolean }>,
    actorId: string,
  ) {
    const existing = await this.repo.findAnnouncementById(id);
    if (!existing) throw new AppError("ANNOUNCEMENT_NOT_FOUND", "Announcement not found", 404);

    const updated = await this.repo.updateAnnouncement(id, {
      title: data.title,
      body: data.body,
      audience: data.audience,
      isActive: data.isActive,
      expiresAt:
        data.expiresAt === undefined
          ? undefined
          : data.expiresAt
            ? new Date(data.expiresAt)
            : null,
    });

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "announcement",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async publishAnnouncement(id: string, actorId: string) {
    const announcement = await this.repo.findAnnouncementById(id);
    if (!announcement) throw new AppError("ANNOUNCEMENT_NOT_FOUND", "Announcement not found", 404);

    const published = await this.repo.updateAnnouncement(id, {
      publishedAt: new Date(),
      isActive: true,
    });

    const users = await this.repo.listActiveUserIds(announcement.audience);
    const rows = users.map((u) => ({
      userId: u.id,
      title: announcement.title,
      message: announcement.body,
      category: "ANNOUNCEMENT" as const,
      link: `/announcements/${announcement.id}`,
    }));

    if (rows.length > 0) {
      await this.repo.createMany(rows);
    }

    await writeAuditLog({
      userId: actorId,
      action: "publish",
      entity: "announcement",
      entityId: id,
      after: { fanOut: rows.length },
    });

    return { announcement: published, notified: rows.length };
  }

  listAnnouncements(opts?: { activeOnly?: boolean }) {
    return this.repo.listAnnouncements(opts);
  }

  async deleteAnnouncement(id: string, actorId: string) {
    const existing = await this.repo.findAnnouncementById(id);
    if (!existing) throw new AppError("ANNOUNCEMENT_NOT_FOUND", "Announcement not found", 404);
    await this.repo.softDeleteAnnouncement(id);
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "announcement",
      entityId: id,
      before: existing,
    });
    return { id, deleted: true };
  }
}

export const notificationService = new NotificationService();
