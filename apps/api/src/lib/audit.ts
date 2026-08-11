import { prisma } from "./prisma";

type AuditParams = {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
};

export async function writeAuditLog(params: AuditParams): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      before: params.before ? (params.before as object) : undefined,
      after: params.after ? (params.after as object) : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}
