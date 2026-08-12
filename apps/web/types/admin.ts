/**
 * Frontend mirror of admin settings, templates, audit, and master-data APIs.
 * Backend (`apps/api`) remains the source of truth.
 */

export type AuditLogUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
};

export type AuditLog = {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp?: string;
  createdAt: string;
  user?: AuditLogUser | null;
};

export type AuditLogQuery = {
  userId?: string;
  entity?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type SystemSetting = {
  id: string;
  key: string;
  value: string;
  category: string;
  description?: string | null;
  isSecret: boolean;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UpsertSettingItem = {
  key: string;
  value: string;
  category?: string;
  description?: string;
  isSecret?: boolean;
};

export type UpsertSettingsInput = {
  settings: UpsertSettingItem[];
};

export type NotificationTemplate = {
  id: string;
  code: string;
  name: string;
  channel: string;
  subject?: string | null;
  body: string;
  description?: string | null;
  isActive: boolean;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type CreateNotificationTemplateInput = {
  code: string;
  name: string;
  channel?: string;
  subject?: string;
  body: string;
  description?: string;
  isActive?: boolean;
};

export type UpdateNotificationTemplateInput = Partial<
  Omit<CreateNotificationTemplateInput, "code">
>;

export type MasterDataSummary = {
  departments: number;
  teams: number;
  designations: number;
  offices: number;
  employeeTypes: number;
  employmentStatuses: number;
  roles: number;
  permissions: number;
};

export type IntegrationPlaceholder = {
  id: string;
  name: string;
  status: "coming_soon";
  phase: number;
};

export type SecurityEvent = {
  id: string;
  userId?: string | null;
  eventType: string;
  severity: string;
  message: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: unknown;
  createdAt: string;
  user?: AuditLogUser | null;
};

export type SecurityEventQuery = {
  userId?: string;
  eventType?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};
