-- Phase 10–12 permissions (optional SQL seed; seed.ts is authoritative)

INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'Read Reports', 'report.read', 'Reporting', 'Report', 'report', 'read', 'View report data and KPIs', true, now(), now()),
  (gen_random_uuid()::text, 'Export Reports', 'report.export', 'Reporting', 'Report', 'report', 'export', 'Export reports as CSV/PDF', true, now(), now()),
  (gen_random_uuid()::text, 'Manage Report Schedules', 'report.schedule.manage', 'Reporting', 'Report', 'report', 'schedule_manage', 'CRUD scheduled reports', true, now(), now()),
  (gen_random_uuid()::text, 'Executive Dashboard', 'dashboard.executive.read', 'Administration', 'Dashboard', 'dashboard', 'executive_read', 'View executive KPIs', true, now(), now()),
  (gen_random_uuid()::text, 'Read Audit Logs', 'audit.read', 'Administration', 'Audit', 'audit', 'read', 'View audit log entries', true, now(), now()),
  (gen_random_uuid()::text, 'Manage Settings', 'settings.manage', 'Administration', 'Settings', 'settings', 'manage', 'Manage system settings', true, now(), now()),
  (gen_random_uuid()::text, 'Manage Notification Templates', 'template.manage', 'Administration', 'Template', 'template', 'manage', 'CRUD notification templates', true, now(), now()),
  (gen_random_uuid()::text, 'Read Security Events', 'security.read', 'Administration', 'Security', 'security', 'read', 'View security event log', true, now(), now())
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid()::text, r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('super_admin', 'admin')
  AND p.code IN (
    'report.read', 'report.export', 'report.schedule.manage',
    'dashboard.executive.read', 'audit.read', 'settings.manage', 'template.manage', 'security.read'
  )
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid()::text, r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'hr'
  AND p.code IN ('report.read', 'report.export')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid()::text, r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('finance', 'payroll')
  AND p.code IN ('report.read', 'report.export')
ON CONFLICT DO NOTHING;
