import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../lib/env";

// Use forward slashes so swagger-jsdoc's glob works on Windows
const routesDir = path.join(process.cwd(), "src", "routes").replace(/\\/g, "/");
const routesGlob = `${routesDir}/*.ts`;
const docsGlob = `${routesDir}/*.docs.ts`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Workforce 360 ERP API",
      version: "0.1.0",
      description: `
Production-grade ERP API built with Express, Prisma, and PostgreSQL.

## Why \`/\` only shows a small JSON ping
Visiting \`http://localhost:4000/\` is the **service root**, not a route listing.
All domain endpoints live under \`/api/...\`. Use this Swagger UI to browse and try them.

## Architecture
- Frontend (Next.js) calls this API only — zero direct database access
- Backend owns ALL data access, business logic, and RBAC enforcement
- Auth via JWT (access + refresh tokens in httpOnly cookies)

## How to authenticate in Swagger
**Option A — Cookie (recommended):**
1. Call \`POST /api/auth/login\` with the demo credentials
2. Browser stores \`accessToken\` / \`refreshToken\` cookies
3. Subsequent "Try it out" calls include those cookies

**Option B — Bearer token:**
1. Call \`POST /api/auth/login\` and copy \`data.accessToken\`
2. Click **Authorize**, paste the token (no \`Bearer \` prefix needed if using the bearer field)
3. Requests send \`Authorization: Bearer <token>\`

## Demo credentials
- Email: \`admin@workforce360.com\`
- Password: \`Admin@123\`

## Response format
\`\`\`json
{
  "data": <payload> | null,
  "error": { "code": "...", "message": "..." } | null,
  "meta": { "page": 1, "pageSize": 20, "total": 100 } | null
}
\`\`\`
      `,
      contact: {
        name: "Workforce 360 Support",
        email: "admin@workforce360.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT access token stored in httpOnly cookie (set automatically after login)",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Paste the accessToken from POST /api/auth/login",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            code: { type: "string", example: "UNAUTHORIZED" },
            message: { type: "string", example: "Authentication required" },
            details: { type: "object" },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            data: { type: "object", nullable: true },
            error: {
              allOf: [{ $ref: "#/components/schemas/Error" }],
              nullable: true,
            },
            meta: { type: "object", nullable: true },
          },
        },
      },
    },
    tags: [
      {
        name: "Health",
        description: "System health checks",
      },
      {
        name: "Authentication",
        description: "User authentication and session management",
      },
      {
        name: "Users",
        description: "User management endpoints",
      },
      {
        name: "Roles",
        description: "Role and permission management",
      },
      {
        name: "Organization - Departments",
        description: "Company departments and hierarchy",
      },
      {
        name: "Organization - Teams",
        description: "Teams within departments",
      },
      {
        name: "Organization - Designations",
        description: "Job titles and levels by department",
      },
      {
        name: "Organization - Offices",
        description: "Office locations and branches",
      },
      {
        name: "Organization - Employee Types",
        description: "Employment classifications (Full-Time, Contract, etc.)",
      },
      {
        name: "Organization - Employment Statuses",
        description: "Employment lifecycle statuses (Active, On Leave, etc.)",
      },
      {
        name: "Attendance",
        description: "Attendance tracking, shifts, holidays, and corrections",
      },
      {
        name: "Leave Management",
        description: "Leave types, balances, applications, and approvals",
      },
      {
        name: "Asset Management",
        description: "Asset tracking, assignment, returns, and history",
      },
      {
        name: "Approvals",
        description: "Generic multi-level approval workflow engine",
      },
      {
        name: "Finance",
        description: "Clients, invoices, payments (Stripe/Razorpay), and employee reimbursements",
      },
      {
        name: "Payroll",
        description: "Versioned salary structures, salary revisions, payroll runs, and payslips",
      },
    ],
  },
  apis: [routesGlob, docsGlob],
};

export const swaggerSpec = swaggerJsdoc(options);
