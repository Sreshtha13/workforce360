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
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
