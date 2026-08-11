import type { Prisma } from "@prisma/client";
import { formatEmployeeId, parseEmployeeIdSequence } from "../lib/employee-id";
import { AppError, isUniqueConstraintOnField, mapPrismaError } from "../lib/app-error";
import { prisma } from "../lib/prisma";

const SEQUENCE_ID = "default";
const MAX_ALLOCATION_RETRIES = 5;

type DbClient = Prisma.TransactionClient | typeof prisma;

async function readMaxSequenceFromDatabase(client: DbClient): Promise<number> {
  const [userIds, employeeCodes] = await Promise.all([
    client.user.findMany({
      where: { deletedAt: null, employeeId: { not: null } },
      select: { employeeId: true },
    }),
    client.employee.findMany({
      where: { deletedAt: null },
      select: { employeeCode: true },
    }),
  ]);

  let maxSequence = 0;
  for (const row of userIds) {
    const sequence = row.employeeId ? parseEmployeeIdSequence(row.employeeId) : null;
    if (sequence !== null && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }
  for (const row of employeeCodes) {
    const sequence = parseEmployeeIdSequence(row.employeeCode);
    if (sequence !== null && sequence > maxSequence) {
      maxSequence = sequence;
    }
  }

  return maxSequence;
}

async function allocateWithinTransaction(tx: Prisma.TransactionClient): Promise<string> {
  const existing = await tx.employeeIdSequence.findUnique({ where: { id: SEQUENCE_ID } });

  if (!existing) {
    const maxFromDatabase = await readMaxSequenceFromDatabase(tx);
    const nextValue = maxFromDatabase + 1;
    await tx.employeeIdSequence.create({
      data: { id: SEQUENCE_ID, lastValue: nextValue },
    });
    return formatEmployeeId(nextValue);
  }

  const nextValue = existing.lastValue + 1;
  await tx.employeeIdSequence.update({
    where: { id: SEQUENCE_ID },
    data: { lastValue: nextValue },
  });
  return formatEmployeeId(nextValue);
}

/**
 * Atomically allocates the next EMP### identifier using a database-backed sequence.
 * Retries when a concurrent insert wins the same code (unique constraint).
 */
export async function allocateNextEmployeeId(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ALLOCATION_RETRIES; attempt++) {
    const candidate = await prisma.$transaction((tx) => allocateWithinTransaction(tx));

    const collision =
      (await prisma.user.findFirst({
        where: { employeeId: candidate, deletedAt: null },
        select: { id: true },
      })) ??
      (await prisma.employee.findFirst({
        where: { employeeCode: candidate, deletedAt: null },
        select: { id: true },
      }));

    if (!collision) {
      return candidate;
    }
  }

  throw new AppError(
    "EMPLOYEE_ID_ALLOCATION_FAILED",
    "Unable to allocate a unique employee ID. Please try again.",
    503,
  );
}

/** Preview the next ID without consuming the sequence (for form prefill). */
export async function previewNextEmployeeId(): Promise<string> {
  const row = await prisma.employeeIdSequence.findUnique({ where: { id: SEQUENCE_ID } });
  if (row) {
    return formatEmployeeId(row.lastValue + 1);
  }
  const maxFromDatabase = await readMaxSequenceFromDatabase(prisma);
  return formatEmployeeId(maxFromDatabase + 1);
}

export function isEmployeeIdConflict(error: unknown): boolean {
  return (
    isUniqueConstraintOnField(error, ["employee_id", "employeeId"]) ||
    isUniqueConstraintOnField(error, ["employee_code", "employeeCode"])
  );
}

export { mapPrismaError };
