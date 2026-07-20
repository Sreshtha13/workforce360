-- Approved position capacity per designation (not a cached user count).
ALTER TABLE "designations" ADD COLUMN "headcount" INTEGER NOT NULL DEFAULT 1;
