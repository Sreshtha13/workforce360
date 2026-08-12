import { auditLogRepository, type AuditLogListQuery } from "../repositories/audit.repository";

export class AuditService {
  list(query: AuditLogListQuery) {
    return auditLogRepository.list(query);
  }
}

export const auditService = new AuditService();
