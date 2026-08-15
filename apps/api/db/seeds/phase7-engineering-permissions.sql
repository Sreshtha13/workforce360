-- Phase 7: Engineering module permissions

INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Releases', 'engineering.release.read', 'Engineering', 'Release Management', 'release', 'read', 'View software releases', true, now(), now()),
  (gen_random_uuid(), 'Create Releases', 'engineering.release.create', 'Engineering', 'Release Management', 'release', 'create', 'Create software releases', true, now(), now()),
  (gen_random_uuid(), 'Update Releases', 'engineering.release.update', 'Engineering', 'Release Management', 'release', 'update', 'Update software releases', true, now(), now()),
  (gen_random_uuid(), 'Deploy Releases', 'engineering.release.deploy', 'Engineering', 'Release Management', 'release', 'deploy', 'Deploy or rollback releases', true, now(), now()),

  (gen_random_uuid(), 'View Test Cases', 'engineering.testcase.read', 'Engineering', 'QA', 'testcase', 'read', 'View test cases', true, now(), now()),
  (gen_random_uuid(), 'Manage Test Cases', 'engineering.testcase.create', 'Engineering', 'QA', 'testcase', 'create', 'Create and update test cases', true, now(), now()),
  (gen_random_uuid(), 'Execute Test Cases', 'engineering.testcase.execute', 'Engineering', 'QA', 'testcase', 'execute', 'Execute test cases and record results', true, now(), now()),

  (gen_random_uuid(), 'View Engineering Docs', 'engineering.doc.read', 'Engineering', 'Documentation', 'doc', 'read', 'View technical documentation', true, now(), now()),
  (gen_random_uuid(), 'Manage Engineering Docs', 'engineering.doc.create', 'Engineering', 'Documentation', 'doc', 'create', 'Create and update technical documentation', true, now(), now()),
  (gen_random_uuid(), 'Publish Engineering Docs', 'engineering.doc.publish', 'Engineering', 'Documentation', 'doc', 'publish', 'Publish technical documentation', true, now(), now()),

  (gen_random_uuid(), 'View Training', 'engineering.training.read', 'Engineering', 'Training', 'training', 'read', 'View technical training materials', true, now(), now()),
  (gen_random_uuid(), 'Manage Training', 'engineering.training.create', 'Engineering', 'Training', 'training', 'create', 'Create and update training materials', true, now(), now()),
  (gen_random_uuid(), 'Enroll Training', 'engineering.training.enroll', 'Engineering', 'Training', 'training', 'enroll', 'Enroll in and track training progress', true, now(), now()),

  (gen_random_uuid(), 'View Code Reviews', 'engineering.codereview.read', 'Engineering', 'Code Review', 'codereview', 'read', 'View code review requests', true, now(), now()),
  (gen_random_uuid(), 'Create Code Reviews', 'engineering.codereview.create', 'Engineering', 'Code Review', 'codereview', 'create', 'Request and update code reviews', true, now(), now()),
  (gen_random_uuid(), 'Approve Code Reviews', 'engineering.codereview.approve', 'Engineering', 'Code Review', 'codereview', 'approve', 'Approve or request changes on code reviews', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Grant to developer role
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'developer'
  AND p.code LIKE 'engineering.%'
ON CONFLICT DO NOTHING;

-- Grant to super_admin (all engineering permissions)
INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
SELECT gen_random_uuid(), r.id, p.id, now(), now()
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'super_admin'
  AND p.code LIKE 'engineering.%'
ON CONFLICT DO NOTHING;
