import { prisma } from "../lib/prisma";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";
import { userIsSuperAdmin } from "../lib/super-admin";
import { renderTemplate } from "../lib/template-render";
import { listAllIntegrations } from "../lib/integrations/registry";

export class SettingsService {
  async listSettings(actorId: string) {
    const settings = await prisma.systemSetting.findMany({
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });
    const isSuper = await userIsSuperAdmin(actorId);
    return settings.map((s) => ({
      ...s,
      value: s.isSecret && !isSuper ? "********" : s.value,
    }));
  }

  async upsertSettings(
    updates: Array<{ key: string; value: string; category?: string; description?: string; isSecret?: boolean }>,
    actorId: string,
  ) {
    const results = [];
    for (const item of updates) {
      const existing = await prisma.systemSetting.findUnique({ where: { key: item.key } });
      const row = await prisma.systemSetting.upsert({
        where: { key: item.key },
        create: {
          key: item.key,
          value: item.value,
          category: item.category ?? "general",
          description: item.description,
          isSecret: item.isSecret ?? false,
          updatedById: actorId,
        },
        update: {
          value: item.value,
          category: item.category,
          description: item.description,
          isSecret: item.isSecret,
          updatedById: actorId,
        },
      });
      await writeAuditLog({
        userId: actorId,
        action: existing ? "update" : "create",
        entity: "system_setting",
        entityId: row.id,
        before: existing,
        after: row,
      });
      results.push(row);
    }
    return results;
  }

  async getSettingValue(key: string): Promise<string | null> {
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? null;
  }

  // --- Notification templates ---

  listTemplates() {
    return prisma.notificationTemplate.findMany({
      where: { deletedAt: null },
      orderBy: { code: "asc" },
    });
  }

  async getTemplate(id: string) {
    const tpl = await prisma.notificationTemplate.findFirst({
      where: { id, deletedAt: null },
    });
    if (!tpl) throw new AppError("TEMPLATE_NOT_FOUND", "Template not found", 404);
    return tpl;
  }

  async getTemplateByCode(code: string) {
    return prisma.notificationTemplate.findFirst({
      where: { code, deletedAt: null, isActive: true },
    });
  }

  async createTemplate(
    input: {
      code: string;
      name: string;
      channel?: string;
      subject?: string;
      body: string;
      description?: string;
      isActive?: boolean;
    },
    actorId: string,
  ) {
    const tpl = await prisma.notificationTemplate.create({
      data: {
        code: input.code,
        name: input.name,
        channel: input.channel ?? "EMAIL",
        subject: input.subject,
        body: input.body,
        description: input.description,
        isActive: input.isActive ?? true,
        updatedById: actorId,
      },
    });
    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "notification_template",
      entityId: tpl.id,
      after: tpl,
    });
    return tpl;
  }

  async updateTemplate(
    id: string,
    input: Partial<{
      name: string;
      channel: string;
      subject: string | null;
      body: string;
      description: string | null;
      isActive: boolean;
    }>,
    actorId: string,
  ) {
    const existing = await this.getTemplate(id);
    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: { ...input, updatedById: actorId },
    });
    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "notification_template",
      entityId: id,
      before: existing,
      after: updated,
    });
    return updated;
  }

  async deleteTemplate(id: string, actorId: string) {
    const existing = await this.getTemplate(id);
    const updated = await prisma.notificationTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedById: actorId },
    });
    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "notification_template",
      entityId: id,
      before: existing,
    });
    return updated;
  }

  /** Render a template by code; returns null if missing (caller uses hardcoded fallback). */
  async renderByCode(
    code: string,
    vars: Record<string, string>,
  ): Promise<{ subject: string; body: string } | null> {
    const tpl = await this.getTemplateByCode(code);
    if (!tpl) return null;
    return {
      subject: renderTemplate(tpl.subject ?? "", vars),
      body: renderTemplate(tpl.body, vars),
    };
  }

  async getMasterDataSummary() {
    const [
      departments,
      teams,
      designations,
      offices,
      employeeTypes,
      employmentStatuses,
      roles,
      permissions,
    ] = await Promise.all([
      prisma.department.count({ where: { deletedAt: null } }),
      prisma.team.count({ where: { deletedAt: null } }),
      prisma.designation.count({ where: { deletedAt: null } }),
      prisma.office.count({ where: { deletedAt: null } }),
      prisma.employeeType.count({ where: { deletedAt: null } }),
      prisma.employmentStatus.count({ where: { deletedAt: null } }),
      prisma.role.count({ where: { deletedAt: null } }),
      prisma.permission.count({ where: { deletedAt: null } }),
    ]);

    return {
      departments,
      teams,
      designations,
      offices,
      employeeTypes,
      employmentStatuses,
      roles,
      permissions,
    };
  }

  listIntegrationsPlaceholder() {
    return listAllIntegrations();
  }
}

export const settingsService = new SettingsService();
