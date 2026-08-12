import type { NotificationCategory, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class NotificationRepository {
  create(data: Prisma.NotificationUncheckedCreateInput) {
    return prisma.notification.create({ data });
  }

  createMany(data: Prisma.NotificationCreateManyInput[]) {
    return prisma.notification.createMany({ data });
  }

  listForUser(
    userId: string,
    opts?: { unreadOnly?: boolean; category?: NotificationCategory; take?: number; skip?: number },
  ) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      deletedAt: null,
    };
    if (opts?.unreadOnly) where.isRead = false;
    if (opts?.category) where.category = opts.category;

    return prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: opts?.take ?? 50,
      skip: opts?.skip ?? 0,
    });
  }

  countUnread(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false, deletedAt: null },
    });
  }

  markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId, deletedAt: null },
      data: { isRead: true },
    });
  }

  markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false, deletedAt: null },
      data: { isRead: true },
    });
  }

  updateEmailSentAt(id: string, at: Date) {
    return prisma.notification.update({
      where: { id },
      data: { emailSentAt: at },
    });
  }

  findPreference(userId: string, category: NotificationCategory) {
    return prisma.notificationPreference.findFirst({
      where: { userId, category, deletedAt: null },
    });
  }

  listPreferences(userId: string) {
    return prisma.notificationPreference.findMany({
      where: { userId, deletedAt: null },
      orderBy: { category: "asc" },
    });
  }

  upsertPreference(data: {
    userId: string;
    category: NotificationCategory;
    inAppEnabled: boolean;
    emailEnabled: boolean;
  }) {
    return prisma.notificationPreference.upsert({
      where: {
        userId_category: { userId: data.userId, category: data.category },
      },
      create: data,
      update: {
        inAppEnabled: data.inAppEnabled,
        emailEnabled: data.emailEnabled,
        deletedAt: null,
      },
    });
  }

  createAnnouncement(data: Prisma.AnnouncementUncheckedCreateInput) {
    return prisma.announcement.create({ data });
  }

  updateAnnouncement(id: string, data: Prisma.AnnouncementUncheckedUpdateInput) {
    return prisma.announcement.update({ where: { id }, data });
  }

  findAnnouncementById(id: string) {
    return prisma.announcement.findFirst({ where: { id, deletedAt: null } });
  }

  listAnnouncements(opts?: { activeOnly?: boolean }) {
    const where: Prisma.AnnouncementWhereInput = { deletedAt: null };
    if (opts?.activeOnly) where.isActive = true;
    return prisma.announcement.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  softDeleteAnnouncement(id: string) {
    return prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  listActiveUserIds(audience: string): Promise<{ id: string; email: string | null }[]> {
    const where: Prisma.UserWhereInput = { deletedAt: null };
    if (audience.startsWith("ROLE:")) {
      const code = audience.slice(5);
      where.userRoles = { some: { role: { code }, deletedAt: null } };
    } else if (audience.startsWith("DEPT:")) {
      where.departmentId = audience.slice(5);
    }
    return prisma.user.findMany({
      where,
      select: { id: true, email: true },
    });
  }

  findUserEmail(userId: string) {
    return prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true },
    });
  }
}
