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
      version: "1.0.0-mvp",
      description: `
Production-grade ERP API — Express, Prisma, PostgreSQL.

## Modules (by phase)
| Phase | Modules |
|-------|---------|
| 0–1 | Health, Auth, Users, Roles, Organization |
| 2 | Recruitment, Careers, HR, Portal, Storage |
| 3 | Attendance, Leave, Assets, Approvals |
| 4 | Finance, Payroll |
| 5–6 | Business Development, Project Management |
| 7 | Engineering workflows (via PM/HR routes) |
| 8–9 | Helpdesk, Notifications, Documents |
| 10 | Reports & KPIs |
| 11 | Settings, Templates, Admin |
| 12 | Security events, MFA |
| 13 | Integrations, Payment webhooks |

## Authentication
Cookie (recommended): POST /api/auth/login — browser stores httpOnly cookies.

Bearer: Copy accessToken from login response, then Authorize in the API docs UI.

Demo: admin@workforce360.com / Admin@123

## Response envelope
JSON: { data, error, meta } — meta may include page, pageSize, total for lists.
      `,
      contact: {
        name: "Workforce 360 Support",
        email: "admin@workforce360.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: "Local development",
      },
      {
        url: "https://api.staging.workforce360.example",
        description: "Staging (replace with your host)",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "JWT access token (httpOnly cookie after login)",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
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
      { name: "Health", description: "System health checks" },
      { name: "Authentication", description: "Login, OAuth, MFA, sessions" },
      { name: "Users", description: "User management" },
      { name: "Roles", description: "Roles and permissions" },
      { name: "Organization - Departments", description: "Departments" },
      { name: "Organization - Teams", description: "Teams" },
      { name: "Organization - Designations", description: "Designations" },
      { name: "Organization - Offices", description: "Offices" },
      { name: "Organization - Employee Types", description: "Employee types" },
      { name: "Organization - Employment Statuses", description: "Employment statuses" },
      { name: "Careers", description: "Public careers portal (no auth)" },
      { name: "Recruitment", description: "Jobs, candidates, applications, offers" },
      { name: "HR", description: "Employee master, policies, HR operations" },
      { name: "Employee Portal", description: "Self-service portal" },
      { name: "Storage", description: "Presigned file uploads" },
      { name: "Dashboard", description: "Admin dashboard widgets" },
      { name: "Attendance", description: "Attendance and shifts" },
      { name: "Leave Management", description: "Leave policies and applications" },
      { name: "Asset Management", description: "Company assets" },
      { name: "Approvals", description: "Approval workflows" },
      { name: "Finance", description: "Clients, invoices, payments" },
      { name: "Payroll", description: "Salary, payroll runs, payslips" },
      { name: "Business Development", description: "Contacts, leads, bids, proposals" },
      { name: "Project Management", description: "Projects, tasks, sprints, timesheets" },
      { name: "Engineering", description: "Releases, test cases, docs, training, code reviews" },
      { name: "Helpdesk", description: "Support tickets, SLA, knowledge base" },
      { name: "Notifications", description: "In-app notifications and announcements" },
      { name: "Documents", description: "Document management (DMS)" },
      { name: "Reports", description: "KPIs, exports, scheduled reports" },
      { name: "Audit Logs", description: "Audit trail" },
      { name: "Settings", description: "System settings" },
      { name: "Notification Templates", description: "Email/in-app templates" },
      { name: "Admin", description: "Master data and integrations status" },
      { name: "Security", description: "Security events" },
      { name: "Integrations", description: "Outbound webhook subscriptions" },
      { name: "Payment Webhooks", description: "Stripe/Razorpay inbound webhooks" },
    ],
  },
  apis: [routesGlob, docsGlob],
};

export const swaggerSpec = swaggerJsdoc(options);
