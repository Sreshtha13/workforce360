# Integration Testing Guide - Phase 5 & 6

## Overview
This guide provides step-by-step instructions for testing the BD and PM modules integration, focusing on the critical Won Lead → Project handover flow.

## Prerequisites

1. **Backend Running:**
```bash
cd apps/api
npm run dev
# Should be running on http://localhost:4000
```

2. **Frontend Running:**
```bash
cd apps/web
npm run dev
# Should be running on http://localhost:3000
```

3. **Permissions Seeded:**
```bash
cd apps/api
# Verify permissions were seeded
psql $DATABASE_URL -c "SELECT COUNT(*) FROM permissions WHERE module IN ('Business Development', 'Project Management');"
# Should return: 52 (24 BD + 28 PM)
```

4. **Test User with Permissions:**
Create a test user with BD and PM permissions via admin panel, or use super admin account.

## Test Suite

### Test 1: Complete BD → PM Handover Flow ⭐ CRITICAL

**Objective:** Verify that marking a Lead as "WON" automatically creates a Project in PM module.

**Steps:**

1. **Login** as user with BD permissions
   - Navigate to http://localhost:3000/login
   - Login credentials: (your test account)

2. **Create a Contact**
   - Navigate to `/bd/contacts`
   - Click "Add Contact"
   - Fill in:
     - First Name: "John"
     - Last Name: "Smith"
     - Email: "john.smith@acmecorp.com"
     - Company: "Acme Corporation"
     - Designation: "CTO"
   - Click "Create Contact"
   - ✅ Verify: Contact appears in list

3. **Create a Lead**
   - Navigate to `/bd/leads`
   - Click "Add Lead"
   - Fill in:
     - Title: "Enterprise Software Solution"
     - Company Name: "Acme Corporation"
     - Value: 150000
     - Currency: USD
     - Source: "Referral"
     - Description: "Custom CRM system for Acme Corp"
     - Status: NEW
   - Click "Create Lead"
   - ✅ Verify: Lead appears in "New" column

4. **Move Lead Through Pipeline**
   - Drag lead (or click to update status) to "Contacted"
   - ✅ Verify: Lead moves to "Contacted" column
   - Continue moving through: Qualified → Proposal Sent → Negotiation

5. **Mark Lead as WON**
   - Move lead to "Won" column
   - ✅ **CRITICAL:** Backend should automatically create a Project
   - Wait 1-2 seconds for backend processing

6. **Verify Project Creation**
   - Navigate to `/pm/projects`
   - ✅ Verify: New project exists with:
     - Name: "Enterprise Software Solution"
     - Status: "Planning"
     - Budget: USD 150,000
     - Client: "Acme Corporation"
   - Note the project ID

7. **Verify Project Details**
   - Click the project name
   - Navigate to board (`/pm/projects/[id]/board`)
   - ✅ Verify: Kanban board loads
   - ✅ Verify: All 4 columns visible (TODO, IN_PROGRESS, IN_REVIEW, DONE)

8. **Check Backend Audit Log** (Optional)
   ```bash
   # Check audit log for project creation
   psql $DATABASE_URL -c "SELECT * FROM audit_logs WHERE action='create_project_from_lead' ORDER BY created_at DESC LIMIT 1;"
   ```
   - ✅ Verify: Audit entry exists with lead → project mapping

**Expected Result:** Lead successfully creates a Project with all relevant data transferred.

**Pass Criteria:**
- ✅ Lead can be moved to WON status
- ✅ Project automatically appears in PM module
- ✅ Project has correct data (name, budget, client)
- ✅ Project status is PLANNING
- ✅ Audit log records the handover

---

### Test 2: Project Task Management

**Objective:** Verify task creation and Kanban board functionality.

**Steps:**

1. **Create Tasks**
   - In the project board from Test 1
   - Click "Add Task" 3 times with:
     
     Task 1:
     - Title: "Database Design"
     - Priority: HIGH
     - Estimated Hours: 16
     
     Task 2:
     - Title: "UI Mockups"
     - Priority: MEDIUM
     - Estimated Hours: 8
     
     Task 3:
     - Title: "API Development"
     - Priority: HIGH
     - Estimated Hours: 40

   - ✅ Verify: All 3 tasks appear in TODO column

2. **Move Tasks**
   - Click first task
   - ✅ Verify: Would navigate to task detail (page not built yet)
   - Return to board
   - Manually update task status to IN_PROGRESS via API or future UI
   - ✅ Verify: Task moves to IN_PROGRESS column

3. **Verify Counts**
   - Check column headers
   - ✅ Verify: TODO shows (2), IN_PROGRESS shows (1)
   - Return to `/pm/projects`
   - ✅ Verify: Project task count shows "3"

**Expected Result:** Tasks can be created and moved between columns.

**Pass Criteria:**
- ✅ Tasks create successfully
- ✅ Tasks display in correct columns
- ✅ Task counts are accurate
- ✅ Task cards show priority, hours, assignee

---

### Test 3: API Client Integration

**Objective:** Verify all API client methods work correctly.

**Test via Browser Console:**

```javascript
// Open browser console on any authenticated page

// Test BD API
const contact = await apiClient.bd.contacts.create({
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@test.com",
  company: "Test Inc"
});
console.log("Contact created:", contact);

const leads = await apiClient.bd.leads.list();
console.log("Leads:", leads);

const pipeline = await apiClient.bd.leads.getPipeline();
console.log("Pipeline summary:", pipeline);

// Test PM API
const projects = await apiClient.pm.projects.list();
console.log("Projects:", projects);

const tasks = await apiClient.pm.tasks.list({ projectId: "YOUR_PROJECT_ID" });
console.log("Tasks:", tasks);
```

**Expected Result:** All API calls return data without errors.

**Pass Criteria:**
- ✅ No CORS errors
- ✅ No authentication errors
- ✅ Data returned in correct format
- ✅ TypeScript types match responses

---

### Test 4: Permissions & RBAC

**Objective:** Verify permission enforcement.

**Steps:**

1. **Create Test Users:**
   - User A: BD Team only (all `bd.*` permissions)
   - User B: PM Team only (all `pm.*` permissions)
   - User C: Developer (only `pm.task.*` and `pm.project.read`)

2. **Test User A (BD Team):**
   - Login as User A
   - ✅ Can access `/bd/*` routes
   - ✅ Can create leads, contacts, bids, proposals
   - ❌ Cannot access `/pm/*` routes (should show 403 or redirect)

3. **Test User B (PM Team):**
   - Login as User B
   - ✅ Can access `/pm/*` routes
   - ✅ Can create projects, tasks, sprints
   - ✅ Can view leads (read-only) for handover context
   - ❌ Cannot create/edit leads

4. **Test User C (Developer):**
   - Login as User C
   - ✅ Can view `/pm/projects` (read-only)
   - ✅ Can view `/pm/tasks` assigned to them
   - ✅ Can update task status
   - ✅ Can log time entries
   - ❌ Cannot create projects
   - ❌ Cannot access `/bd/*`

**Expected Result:** Users can only access/modify what their permissions allow.

**Pass Criteria:**
- ✅ Permission checks work on all routes
- ✅ 403 errors or redirects for unauthorized access
- ✅ UI hides actions user can't perform
- ✅ Backend validates permissions (primary security)

---

### Test 5: Search & Filtering

**Objective:** Verify search functionality.

**Steps:**

1. **Contacts Search:**
   - Navigate to `/bd/contacts`
   - Create 5+ contacts with different companies
   - Type "Acme" in search
   - ✅ Verify: Only Acme-related contacts show
   - Clear search
   - ✅ Verify: All contacts return

2. **Projects Search:**
   - Navigate to `/pm/projects`
   - Create 5+ projects
   - Type project name in search
   - ✅ Verify: Filtered results
   - Test partial matches
   - ✅ Verify: Debounce works (300ms delay)

**Expected Result:** Search filters results correctly with debounce.

**Pass Criteria:**
- ✅ Search is case-insensitive
- ✅ Partial matches work
- ✅ Debounce prevents excessive API calls
- ✅ Clear search returns all results

---

### Test 6: Data Integrity

**Objective:** Verify data relationships are maintained.

**Steps:**

1. **Lead → Project Link:**
   - Create lead and mark as WON
   - Find the created project
   - Query database:
   ```bash
   psql $DATABASE_URL -c "SELECT id, name, lead_id FROM projects WHERE lead_id IS NOT NULL LIMIT 5;"
   ```
   - ✅ Verify: `lead_id` is populated

2. **Task → Project Link:**
   - Create task in project
   - Query database:
   ```bash
   psql $DATABASE_URL -c "SELECT id, title, project_id FROM tasks WHERE project_id = 'YOUR_PROJECT_ID';"
   ```
   - ✅ Verify: `project_id` matches

3. **Soft Deletes:**
   - All entities should have `deleted_at` column
   - Deletes should set `deleted_at`, not remove row
   - List queries should exclude deleted records

**Expected Result:** All foreign keys and relationships are correct.

**Pass Criteria:**
- ✅ Foreign keys are valid
- ✅ Cascade deletes work (if configured)
- ✅ Soft deletes preserve data
- ✅ No orphaned records

---

### Test 7: Form Validation

**Objective:** Verify client-side and server-side validation.

**Steps:**

1. **Required Fields:**
   - Try to create lead without title
   - ✅ Verify: Form prevents submission
   - ✅ Verify: Required field indicator shows

2. **Type Validation:**
   - Try to enter text in "Value" field
   - ✅ Verify: Only numbers accepted
   - Try invalid email format
   - ✅ Verify: Error message shows

3. **Server Validation:**
   - Bypass client validation (via browser tools)
   - Submit invalid data
   - ✅ Verify: Backend returns 400 error
   - ✅ Verify: Error message is user-friendly

**Expected Result:** Both client and server validate inputs.

**Pass Criteria:**
- ✅ Client prevents invalid submissions
- ✅ Server rejects invalid data
- ✅ Error messages are clear
- ✅ Zod schemas enforce types

---

### Test 8: TanStack Query Caching

**Objective:** Verify query caching works correctly.

**Steps:**

1. **Initial Load:**
   - Navigate to `/bd/leads`
   - Note network requests in DevTools
   - ✅ Verify: API call made

2. **Navigation Away:**
   - Navigate to `/bd/contacts`
   - Return to `/bd/leads`
   - ✅ Verify: Data loads instantly from cache
   - ✅ Verify: Background refetch happens

3. **Mutation Invalidation:**
   - Create new lead
   - ✅ Verify: Lead list auto-refreshes
   - ✅ Verify: New lead appears without manual refresh

4. **Stale Data:**
   - Wait 5 minutes (or adjust staleTime)
   - Interact with the app
   - ✅ Verify: Stale queries refetch

**Expected Result:** Caching reduces network calls, data stays fresh.

**Pass Criteria:**
- ✅ Cache reduces redundant API calls
- ✅ Mutations invalidate related queries
- ✅ Stale data refetches automatically
- ✅ No stale data issues

---

## Performance Tests

### Load Testing

1. **Create 100 Leads:**
```javascript
for (let i = 0; i < 100; i++) {
  await apiClient.bd.leads.create({
    title: `Lead ${i}`,
    companyName: `Company ${i}`,
    value: Math.random() * 100000,
    status: "NEW"
  });
}
```

2. **Test Kanban Performance:**
   - Navigate to `/bd/leads`
   - ✅ Verify: Page loads in < 3 seconds
   - ✅ Verify: Scrolling is smooth
   - ✅ Verify: No memory leaks

3. **Create 100 Tasks:**
```javascript
for (let i = 0; i < 100; i++) {
  await apiClient.pm.tasks.create({
    projectId: "YOUR_PROJECT_ID",
    title: `Task ${i}`,
    priority: "MEDIUM"
  });
}
```

4. **Test Task Board Performance:**
   - Navigate to project board
   - ✅ Verify: Page loads in < 3 seconds
   - ✅ Verify: All columns render
   - Consider: Virtual scrolling for 50+ tasks per column

---

## Automated Testing (Optional)

### API Integration Tests

Create `apps/api/tests/integration/bd-pm-handover.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { apiClient } from '../lib/api-client';

describe('BD to PM Handover', () => {
  it('should create project when lead is marked as WON', async () => {
    // Create lead
    const lead = await apiClient.bd.leads.create({
      title: 'Test Lead',
      value: 50000,
      status: 'NEW'
    });

    // Mark as WON
    await apiClient.bd.leads.update(lead.data.id, { status: 'WON' });

    // Verify project created
    const projects = await apiClient.pm.projects.list();
    const createdProject = projects.data.find(p => p.leadId === lead.data.id);
    
    expect(createdProject).toBeDefined();
    expect(createdProject?.name).toBe('Test Lead');
    expect(createdProject?.budget).toBe('50000');
  });
});
```

### E2E Tests with Playwright (Optional)

```typescript
import { test, expect } from '@playwright/test';

test('BD to PM handover flow', async ({ page }) => {
  await page.goto('/bd/leads');
  
  // Create lead
  await page.click('text=Add Lead');
  await page.fill('#title', 'Test Lead');
  await page.fill('#value', '50000');
  await page.click('text=Create Lead');
  
  // Mark as WON
  await page.click('text=Test Lead');
  await page.selectOption('#status', 'WON');
  await page.click('text=Save');
  
  // Check PM module
  await page.goto('/pm/projects');
  await expect(page.locator('text=Test Lead')).toBeVisible();
});
```

---

## Troubleshooting

### Issue: Lead marked as WON but no Project created

**Debug Steps:**
1. Check backend logs for errors
2. Verify lead status actually changed in DB:
   ```bash
   psql $DATABASE_URL -c "SELECT id, title, status, won_at FROM leads WHERE status = 'WON';"
   ```
3. Check if project was created:
   ```bash
   psql $DATABASE_URL -c "SELECT id, name, lead_id FROM projects WHERE lead_id IS NOT NULL;"
   ```
4. Check audit logs:
   ```bash
   psql $DATABASE_URL -c "SELECT * FROM audit_logs WHERE entity = 'project' AND action LIKE '%lead%';"
   ```

### Issue: Permission errors

**Debug Steps:**
1. Verify user has required permissions:
   ```bash
   psql $DATABASE_URL -c "
     SELECT u.email, r.name, p.code 
     FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     JOIN roles r ON ur.role_id = r.id
     JOIN role_permissions rp ON r.id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.id
     WHERE u.email = 'test@example.com';
   "
   ```
2. Check backend logs for RBAC denials
3. Verify frontend making authenticated requests (cookies sent)

### Issue: Data not showing in frontend

**Debug Steps:**
1. Open DevTools Network tab
2. Check API response status
3. Check response body for errors
4. Verify query key matches
5. Check React Query DevTools (if installed)

---

## Success Criteria

All tests must pass for production deployment:

- ✅ Test 1: BD → PM handover works
- ✅ Test 2: Task management functional
- ✅ Test 3: API client works
- ✅ Test 4: Permissions enforced
- ✅ Test 5: Search works
- ✅ Test 6: Data integrity maintained
- ✅ Test 7: Validation works
- ✅ Test 8: Caching works
- ✅ Performance: Pages load < 3 seconds
- ✅ No console errors
- ✅ No TypeScript errors
- ✅ Backend tests pass
- ✅ Audit logs populated

---

## Reporting Issues

When reporting bugs, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots/videos
5. Browser console errors
6. Network tab (API calls)
7. User role/permissions
8. Database state (if relevant)

---

## Next Steps After Testing

1. **Fix any bugs found**
2. **Build remaining detail pages**
3. **Add drag-and-drop to Kanban**
4. **Implement time tracking UI**
5. **Add charts and analytics**
6. **Write user documentation**
7. **Deploy to staging**
8. **User acceptance testing**
9. **Deploy to production**

---

**Document Version:** 1.0
**Last Updated:** Aug 12, 2026
**Status:** Ready for Testing
