import { env } from "../env";
import { getGoogleOAuthClient, generateGoogleAuthUrl } from "../google-oauth";

export type IntegrationStatus = "active" | "configured" | "not_configured" | "coming_soon";

export type IntegrationInfo = {
  id: string;
  name: string;
  category: "mvp" | "future";
  status: IntegrationStatus;
  description: string;
  phase?: number;
};

function emailStatus(): IntegrationStatus {
  if (env.RESEND_API_KEY) return "active";
  if (env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM) return "active";
  return "not_configured";
}

function storageStatus(): IntegrationStatus {
  if (env.STORAGE_PROVIDER === "s3") {
    return env.S3_BUCKET && env.S3_ACCESS_KEY ? "active" : "not_configured";
  }
  return "active";
}

export function listMvpIntegrations(): IntegrationInfo[] {
  const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const stripeConfigured = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PUBLISHABLE_KEY);
  const razorpayConfigured = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

  return [
    {
      id: "google_oauth",
      name: "Google Login",
      category: "mvp",
      status: googleConfigured ? "active" : "not_configured",
      description: "Backend-mediated Google OAuth sign-in",
    },
    {
      id: "email",
      name: "Email (Resend / SMTP)",
      category: "mvp",
      status: emailStatus(),
      description: "Transactional email via Resend API or SMTP",
    },
    {
      id: "storage",
      name: env.STORAGE_PROVIDER === "s3" ? "S3 / Supabase Storage" : "Local file storage",
      category: "mvp",
      status: storageStatus(),
      description: "Document and asset uploads via backend presign proxy",
    },
    {
      id: "stripe",
      name: "Stripe",
      category: "mvp",
      status: stripeConfigured ? "active" : "not_configured",
      description: "Card payments with webhook status updates",
    },
    {
      id: "razorpay",
      name: "Razorpay",
      category: "mvp",
      status: razorpayConfigured ? "active" : "not_configured",
      description: "India payments with webhook status updates",
    },
    {
      id: "webhooks_api",
      name: "REST API & Webhooks framework",
      category: "mvp",
      status: "active",
      description: "OpenAPI docs, payment webhooks, outbound webhook subscriptions",
    },
  ];
}

export function listFutureIntegrations(): IntegrationInfo[] {
  return [
    { id: "teams", name: "Microsoft Teams", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "slack", name: "Slack", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "github", name: "GitHub", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "gitlab", name: "GitLab", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "jira", name: "Jira", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "zoom", name: "Zoom", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "quickbooks", name: "QuickBooks", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "xero", name: "Xero", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "azure_ad", name: "Azure AD / SAML", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
    { id: "ldap", name: "LDAP", category: "future", status: "coming_soon", description: "Post-MVP", phase: 13 },
  ];
}

export function listAllIntegrations(): IntegrationInfo[] {
  return [...listMvpIntegrations(), ...listFutureIntegrations()];
}

export function getGoogleOAuthStatus() {
  const client = getGoogleOAuthClient();
  const url = client ? generateGoogleAuthUrl() : null;
  return {
    enabled: Boolean(client && url),
    url: url ?? undefined,
  };
}
