import type { Prisma } from "@prisma/client";
import {
  departmentPrefix,
  findHighestDesignationSequence,
  formatDesignationCode,
} from "../lib/designation-code";
import { prisma } from "../lib/prisma";

type DbClient = Prisma.TransactionClient | typeof prisma;

async function loadDepartmentOrThrow(departmentId: string, client: DbClient = prisma) {
  const department = await client.department.findFirst({
    where: { id: departmentId, deletedAt: null },
    select: { id: true, code: true, name: true },
  });
  if (!department) {
    throw new Error("Department not found");
  }
  return department;
}

async function nextSequenceForDepartment(
  departmentId: string,
  prefix: string,
  client: DbClient,
): Promise<number> {
  const rows = await client.designation.findMany({
    where: {
      departmentId,
      deletedAt: null,
      code: { startsWith: `${prefix}-` },
    },
    select: { code: true },
  });

  return findHighestDesignationSequence(
    rows.map((r) => r.code),
    prefix,
  ) + 1;
}

/**
 * Preview the next designation code for a department (does not reserve).
 * Format: `{DEPT_PREFIX}-{NNN}` e.g. ENG-001.
 */
export async function previewNextDesignationCode(departmentId: string): Promise<string> {
  const department = await loadDepartmentOrThrow(departmentId);
  const prefix = departmentPrefix(department);
  const next = await nextSequenceForDepartment(departmentId, prefix, prisma);
  return formatDesignationCode(prefix, next);
}

/**
 * Allocate the next designation code inside a transaction.
 * Locks the department row to reduce concurrent collisions.
 */
export async function allocateNextDesignationCode(
  departmentId: string,
  tx: Prisma.TransactionClient,
): Promise<string> {
  await tx.$queryRaw`SELECT id FROM departments WHERE id = ${departmentId} AND deleted_at IS NULL FOR UPDATE`;

  const department = await loadDepartmentOrThrow(departmentId, tx);
  const prefix = departmentPrefix(department);
  const next = await nextSequenceForDepartment(departmentId, prefix, tx);
  return formatDesignationCode(prefix, next);
}
