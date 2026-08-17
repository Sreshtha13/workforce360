import { config } from "dotenv";
import { resolve } from "node:path";
import { z } from "zod";

// Prefer .env.local (local overrides), then .env
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_ACCESS_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  COOKIE_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  
  PASSWORD_MIN_LENGTH: z.coerce.number().int().positive().default(8),
  PASSWORD_REQUIRE_UPPERCASE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  PASSWORD_REQUIRE_LOWERCASE: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  PASSWORD_REQUIRE_NUMBER: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  PASSWORD_REQUIRE_SPECIAL: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().default(".uploads"),
  STORAGE_PUBLIC_BASE_URL: z.string().default("http://localhost:4000"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),

  // Payment gateways (Phase 4). Secret/private keys never leave the backend.
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Frontend base URL used to build payment redirect/return links (Phase 4)
  APP_PUBLIC_BASE_URL: z.string().default("http://localhost:3000"),

  // Email (Phase 8/9). Optional — falls back to console log when unset.
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),

  // MFA (Phase 12)
  MFA_ISSUER: z.string().default("Workforce360"),

  // Error monitoring (optional — Sentry)
  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

/** Comma-separated CORS_ORIGIN values, e.g. http://localhost:3000,http://localhost:3001 */
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;

  if (corsOrigins.includes(origin)) return true;

  // Dev convenience: Next.js may run on 3001+ if 3000 is taken
  if (
    env.NODE_ENV === "development" &&
    /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
  ) {
    return true;
  }

  return false;
}
