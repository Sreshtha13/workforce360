## TC-013 — HR user login lands on dashboard with HR nav items

**Module:** Authentication  
**Feature:** Email/Password Login  
**Scenario Type:** Positive / UI / E2E  
**Priority:** High  
**Severity:** Medium  

**Test Data:** `hr@workforce360.com` / `Hr@123456`

**Steps to Execute:**
1. Login as HR user.
2. Inspect sidebar navigation.

**Expected Result:**
1. Redirect to `/dashboard`.
2. HR section visible: Jobs, Pipeline, Candidates, Employees, etc.
3. Admin-only items (Roles, Permissions) NOT visible unless HR has those permissions.

**Postconditions:** HR session active.
**Actual Result:** : Hr is only showing dashbaord: no exisiting conditions or policies or data :
