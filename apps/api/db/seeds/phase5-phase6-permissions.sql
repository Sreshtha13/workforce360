-- Phase 5 & 6: Business Development and Project Management Permissions
-- Run this script to add the required permissions for BD and PM modules

-- Business Development Permissions

-- Contacts
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Contacts', 'bd.contact.read', 'Business Development', 'Contact Management', 'contact', 'read', 'View client contacts and relationships', true, now(), now()),
  (gen_random_uuid(), 'Create Contacts', 'bd.contact.create', 'Business Development', 'Contact Management', 'contact', 'create', 'Create new client contacts', true, now(), now()),
  (gen_random_uuid(), 'Update Contacts', 'bd.contact.update', 'Business Development', 'Contact Management', 'contact', 'update', 'Edit contact information', true, now(), now()),
  (gen_random_uuid(), 'Delete Contacts', 'bd.contact.delete', 'Business Development', 'Contact Management', 'contact', 'delete', 'Remove contacts', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Leads
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Leads', 'bd.lead.read', 'Business Development', 'Lead Management', 'lead', 'read', 'View leads and pipeline', true, now(), now()),
  (gen_random_uuid(), 'Create Leads', 'bd.lead.create', 'Business Development', 'Lead Management', 'lead', 'create', 'Create new leads', true, now(), now()),
  (gen_random_uuid(), 'Update Leads', 'bd.lead.update', 'Business Development', 'Lead Management', 'lead', 'update', 'Update lead status and information', true, now(), now()),
  (gen_random_uuid(), 'Delete Leads', 'bd.lead.delete', 'Business Development', 'Lead Management', 'lead', 'delete', 'Remove leads', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Bids
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Bids', 'bd.bid.read', 'Business Development', 'Bid Management', 'bid', 'read', 'View bids', true, now(), now()),
  (gen_random_uuid(), 'Create Bids', 'bd.bid.create', 'Business Development', 'Bid Management', 'bid', 'create', 'Create new bids', true, now(), now()),
  (gen_random_uuid(), 'Update Bids', 'bd.bid.update', 'Business Development', 'Bid Management', 'bid', 'update', 'Update bid information', true, now(), now()),
  (gen_random_uuid(), 'Delete Bids', 'bd.bid.delete', 'Business Development', 'Bid Management', 'bid', 'delete', 'Remove bids', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Proposals
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Proposals', 'bd.proposal.read', 'Business Development', 'Proposal Management', 'proposal', 'read', 'View proposals', true, now(), now()),
  (gen_random_uuid(), 'Create Proposals', 'bd.proposal.create', 'Business Development', 'Proposal Management', 'proposal', 'create', 'Create new proposals', true, now(), now()),
  (gen_random_uuid(), 'Update Proposals', 'bd.proposal.update', 'Business Development', 'Proposal Management', 'proposal', 'update', 'Update proposal content and status', true, now(), now()),
  (gen_random_uuid(), 'Delete Proposals', 'bd.proposal.delete', 'Business Development', 'Proposal Management', 'proposal', 'delete', 'Remove proposals', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Communications
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Communications', 'bd.communication.read', 'Business Development', 'Client Communication', 'communication', 'read', 'View client communication log', true, now(), now()),
  (gen_random_uuid(), 'Create Communications', 'bd.communication.create', 'Business Development', 'Client Communication', 'communication', 'create', 'Log client communications', true, now(), now()),
  (gen_random_uuid(), 'Update Communications', 'bd.communication.update', 'Business Development', 'Client Communication', 'communication', 'update', 'Update communication entries', true, now(), now()),
  (gen_random_uuid(), 'Delete Communications', 'bd.communication.delete', 'Business Development', 'Client Communication', 'communication', 'delete', 'Remove communication entries', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Portfolio
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Portfolio', 'bd.portfolio.read', 'Business Development', 'Portfolio Management', 'portfolio', 'read', 'View portfolio items', true, now(), now()),
  (gen_random_uuid(), 'Create Portfolio Items', 'bd.portfolio.create', 'Business Development', 'Portfolio Management', 'portfolio', 'create', 'Add portfolio items', true, now(), now()),
  (gen_random_uuid(), 'Update Portfolio Items', 'bd.portfolio.update', 'Business Development', 'Portfolio Management', 'portfolio', 'update', 'Edit portfolio items', true, now(), now()),
  (gen_random_uuid(), 'Delete Portfolio Items', 'bd.portfolio.delete', 'Business Development', 'Portfolio Management', 'portfolio', 'delete', 'Remove portfolio items', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Project Management Permissions

-- Projects
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Projects', 'pm.project.read', 'Project Management', 'Project Management', 'project', 'read', 'View projects and reports', true, now(), now()),
  (gen_random_uuid(), 'Create Projects', 'pm.project.create', 'Project Management', 'Project Management', 'project', 'create', 'Create new projects', true, now(), now()),
  (gen_random_uuid(), 'Update Projects', 'pm.project.update', 'Project Management', 'Project Management', 'project', 'update', 'Update project information', true, now(), now()),
  (gen_random_uuid(), 'Delete Projects', 'pm.project.delete', 'Project Management', 'Project Management', 'project', 'delete', 'Remove projects', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Milestones
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Milestones', 'pm.milestone.read', 'Project Management', 'Milestone Management', 'milestone', 'read', 'View project milestones', true, now(), now()),
  (gen_random_uuid(), 'Create Milestones', 'pm.milestone.create', 'Project Management', 'Milestone Management', 'milestone', 'create', 'Create project milestones', true, now(), now()),
  (gen_random_uuid(), 'Update Milestones', 'pm.milestone.update', 'Project Management', 'Milestone Management', 'milestone', 'update', 'Update milestone details', true, now(), now()),
  (gen_random_uuid(), 'Delete Milestones', 'pm.milestone.delete', 'Project Management', 'Milestone Management', 'milestone', 'delete', 'Remove milestones', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Tasks
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Tasks', 'pm.task.read', 'Project Management', 'Task Management', 'task', 'read', 'View tasks', true, now(), now()),
  (gen_random_uuid(), 'Create Tasks', 'pm.task.create', 'Project Management', 'Task Management', 'task', 'create', 'Create new tasks', true, now(), now()),
  (gen_random_uuid(), 'Update Tasks', 'pm.task.update', 'Project Management', 'Task Management', 'task', 'update', 'Update task status and details', true, now(), now()),
  (gen_random_uuid(), 'Delete Tasks', 'pm.task.delete', 'Project Management', 'Task Management', 'task', 'delete', 'Remove tasks', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Sprints
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Sprints', 'pm.sprint.read', 'Project Management', 'Sprint Planning', 'sprint', 'read', 'View sprints', true, now(), now()),
  (gen_random_uuid(), 'Create Sprints', 'pm.sprint.create', 'Project Management', 'Sprint Planning', 'sprint', 'create', 'Create new sprints', true, now(), now()),
  (gen_random_uuid(), 'Update Sprints', 'pm.sprint.update', 'Project Management', 'Sprint Planning', 'sprint', 'update', 'Update sprint details', true, now(), now()),
  (gen_random_uuid(), 'Delete Sprints', 'pm.sprint.delete', 'Project Management', 'Sprint Planning', 'sprint', 'delete', 'Remove sprints', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Time Tracking
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Time Entries', 'pm.time.read', 'Project Management', 'Time Tracking', 'time', 'read', 'View time entries', true, now(), now()),
  (gen_random_uuid(), 'Create Time Entries', 'pm.time.create', 'Project Management', 'Time Tracking', 'time', 'create', 'Log time against tasks', true, now(), now()),
  (gen_random_uuid(), 'Update Time Entries', 'pm.time.update', 'Project Management', 'Time Tracking', 'time', 'update', 'Update time entries', true, now(), now()),
  (gen_random_uuid(), 'Delete Time Entries', 'pm.time.delete', 'Project Management', 'Time Tracking', 'time', 'delete', 'Remove time entries', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Team Allocation
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Team Allocations', 'pm.team.read', 'Project Management', 'Team Allocation', 'team', 'read', 'View team allocations', true, now(), now()),
  (gen_random_uuid(), 'Allocate Team Members', 'pm.team.create', 'Project Management', 'Team Allocation', 'team', 'create', 'Allocate team members to projects', true, now(), now()),
  (gen_random_uuid(), 'Update Team Allocations', 'pm.team.update', 'Project Management', 'Team Allocation', 'team', 'update', 'Update team member allocations', true, now(), now()),
  (gen_random_uuid(), 'Remove Team Allocations', 'pm.team.delete', 'Project Management', 'Team Allocation', 'team', 'delete', 'Remove team allocations', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Budget Tracking
INSERT INTO permissions (id, name, code, module, feature, resource, action, description, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'View Budget', 'pm.budget.read', 'Project Management', 'Budget Tracking', 'budget', 'read', 'View project budget and expenses', true, now(), now()),
  (gen_random_uuid(), 'Create Budget Entries', 'pm.budget.create', 'Project Management', 'Budget Tracking', 'budget', 'create', 'Log budget expenses', true, now(), now()),
  (gen_random_uuid(), 'Update Budget Entries', 'pm.budget.update', 'Project Management', 'Budget Tracking', 'budget', 'update', 'Update budget entries', true, now(), now()),
  (gen_random_uuid(), 'Delete Budget Entries', 'pm.budget.delete', 'Project Management', 'Budget Tracking', 'budget', 'delete', 'Remove budget entries', true, now(), now())
ON CONFLICT (code) DO NOTHING;

-- Example: Assign all BD permissions to "Business Development Team" role
-- Uncomment and adjust role code as needed:
-- INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
-- SELECT gen_random_uuid(), r.id, p.id, now(), now()
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE r.code = 'bd_team' AND p.module = 'Business Development';

-- Example: Assign all PM permissions to "Project Manager" role
-- Uncomment and adjust role code as needed:
-- INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
-- SELECT gen_random_uuid(), r.id, p.id, now(), now()
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE r.code = 'project_manager' AND p.module = 'Project Management';
