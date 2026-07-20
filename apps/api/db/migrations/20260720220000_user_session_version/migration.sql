-- Add session version for global JWT invalidation (password change, admin revoke, reuse detection)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_version" INTEGER NOT NULL DEFAULT 0;
