-- CreateTable
CREATE TABLE "health_probes" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'ok',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "health_probes_pkey" PRIMARY KEY ("id")
);

-- Seed a single probe row for GET /api/health
INSERT INTO "health_probes" ("id", "label", "created_at", "updated_at")
VALUES ('seed_health_probe_01', 'ok', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
