# Workforce 360 ERP — Test Case Index (TC-001 to TC-690)

All **690 executable test cases** are ready. Open the file for your TC range.

| File | TC IDs | Count |
|------|--------|-------|
| [TC_001_070_AUTH.md](./TC_001_070_AUTH.md) | TC-001 – TC-070 | 70 |
| [TC_071_150_RBAC_USERS_ORG.md](./TC_071_150_RBAC_USERS_ORG.md) | TC-071 – TC-150 | 80 |
| [TC_151_250_ADMIN_HR.md](./TC_151_250_ADMIN_HR.md) | TC-151 – TC-250 | 100 |
| [TC_251_382_PORTAL_ATTENDANCE.md](./TC_251_382_PORTAL_ATTENDANCE.md) | TC-251 – TC-382 | 132 |
| [TC_383_550_FINANCE_PAYROLL_BD_PM.md](./TC_383_550_FINANCE_PAYROLL_BD_PM.md) | TC-383 – TC-550 | 168 |
| [TC_551_690_ENGINEERING_E2E.md](./TC_551_690_ENGINEERING_E2E.md) | TC-551 – TC-690 | 140 |
| **Total** | | **690** |

## Format

- **TC-001 – TC-070:** Full template (Preconditions, Test Data, Steps, Expected Result, Postconditions, Notes)
- **TC-071 – TC-690:** Compact executable format (Module, Feature, Type, Priority, Steps, Expected)

Both formats are ready to execute manually or import into a test management tool.

## Demo credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@workforce360.com | Admin@123 |
| HR | hr@workforce360.com | Hr@123456 |
| Finance | finance@workforce360.com | Finance@123 |
| Payroll | payroll@workforce360.com | Payroll@123 |

## Suggested execution order

1. TC-001 – TC-070 (Auth & session)
2. TC-087 – TC-106 (RBAC enforcement)
3. TC-459 – TC-490 (Payroll)
4. TC-413 – TC-458 (Finance)
5. TC-671 – TC-690 (E2E journeys)
6. Remaining modules by priority

See [COMPREHENSIVE_TEST_SUITE.md](../COMPREHENSIVE_TEST_SUITE.md) for coverage matrix, risk analysis, and gaps.
