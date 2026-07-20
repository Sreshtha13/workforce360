import fs from "node:fs";
import path from "node:path";

const sqlPath = path.resolve("db/_baseline_diff.sql");
let sql = fs.readFileSync(sqlPath, "utf8");

sql = sql.replace(
  /-- CreateTable\nCREATE TABLE "health_probes"[\s\S]*?;\n\n/,
  "",
);

sql = sql.replace(/\s+"session_version" INTEGER NOT NULL DEFAULT 0,\n/, "\n");
sql = sql.replace(/^CREATE TABLE "/gm, 'CREATE TABLE IF NOT EXISTS "');
sql = sql.replace(/^CREATE UNIQUE INDEX "/gm, 'CREATE UNIQUE INDEX IF NOT EXISTS "');
sql = sql.replace(/^CREATE INDEX "/gm, 'CREATE INDEX IF NOT EXISTS "');

const header = `-- Baseline core schema for shadow DB replay (idempotent on existing DBs).
-- health_probes is created by 20260716120000_init_health_probe.
-- session_version is added by 20260720220000_user_session_version.

`;

const outDir = path.resolve("db/migrations/20260716130000_init_core_schema");
fs.mkdirSync(outDir, { recursive: true });
const output = header + sql;
fs.writeFileSync(path.join(outDir, "migration.sql"), output.replace(/^\uFEFF/gm, ""), "utf8");
console.log(`Wrote ${outDir}/migration.sql`);
