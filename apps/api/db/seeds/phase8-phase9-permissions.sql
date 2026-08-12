-- Phase 8 & 9 permissions (optional SQL seed; seed.ts is authoritative)

INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid()::text, 'Read Approvals', 'approval.read', 'Approvals', 'Approval', 'approval', 'read', 'View approval requests and workflows', true, now(), now()),
  (gen_random_uuid()::text, 'Action Approvals', 'approval.action', 'Approvals', 'Approval', 'approval', 'action', 'Approve or reject pending steps', true, now(), now()),
  (gen_random_uuid()::text, 'Manage Approvals', 'approval.manage', 'Approvals', 'Approval', 'approval', 'manage', 'Manage workflows and escalations', true, now(), now()),
  (gen_random_uuid()::text, 'Delegate Approvals', 'approval.delegate', 'Approvals', 'Approval', 'approval', 'delegate', 'Create and manage delegations', true, now(), now()),
  (gen_random_uuid()::text, 'Read Documents', 'document.read', 'Documents', 'Document', 'document', 'read', 'View documents', true, now(), now()),
  (gen_random_uuid()::text, 'Create Documents', 'document.create', 'Documents', 'Document', 'document', 'create', 'Create documents', true, now(), now()),
  (gen_random_uuid()::text, 'Update Documents', 'document.update', 'Documents', 'Document', 'document', 'update', 'Update document versions', true, now(), now()),
  (gen_random_uuid()::text, 'Delete Documents', 'document.delete', 'Documents', 'Document', 'document', 'delete', 'Delete documents', true, now(), now()),
  (gen_random_uuid()::text, 'Manage Documents', 'document.manage', 'Documents', 'Document', 'document', 'manage', 'Full document administration', true, now(), now()),
  (gen_random_uuid()::text, 'Manage Announcements', 'announcement.manage', 'Notifications', 'Announcement', 'announcement', 'manage', 'Create and publish announcements', true, now(), now()),
  (gen_random_uuid()::text, 'Manage Notification Prefs', 'notification.manage', 'Notifications', 'Notification', 'notification', 'manage', 'Manage notification preferences admin', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Assign new permissions to super_admin and admin
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid()::text, r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('super_admin', 'admin')
  AND p.code IN (
    'approval.read', 'approval.action', 'approval.manage', 'approval.delegate',
    'document.read', 'document.create', 'document.update', 'document.delete', 'document.manage',
    'announcement.manage', 'notification.manage'
  )
ON CONFLICT DO NOTHING;

-- HR: tickets, docs, announcements, approval action/read
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid()::text, r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'hr'
  AND p.code IN (
    'approval.read', 'approval.action', 'approval.manage', 'approval.delegate',
    'document.read', 'document.create', 'document.update', 'document.delete', 'document.manage',
    'announcement.manage'
  )
ON CONFLICT DO NOTHING;

-- Employee: document.read + approval.action/read/delegate
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid()::text, r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'employee'
  AND p.code IN ('document.read', 'approval.read', 'approval.action', 'approval.delegate', 'ticket.create')
ON CONFLICT DO NOTHING;
