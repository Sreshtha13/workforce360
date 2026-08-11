import { Prisma } from "@prisma/client";

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(code: string, message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function isUniqueConstraintOnField(
  error: unknown,
  fieldNames: string[],
): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return fieldNames.some((name) => target.includes(name));
  }

  if (typeof target === "string") {
    return fieldNames.some((name) => target.includes(name));
  }

  return false;
}

export function mapPrismaError(error: unknown): AppError | null {
  if (isUniqueConstraintOnField(error, ["employee_id", "employeeId"])) {
    return new AppError(
      "DUPLICATE_EMPLOYEE_ID",
      "An employee with this ID already exists. Please try again.",
      409,
    );
  }

  if (isUniqueConstraintOnField(error, ["employee_code", "employeeCode"])) {
    return new AppError(
      "DUPLICATE_EMPLOYEE_CODE",
      "An employee with this code already exists. Please try again.",
      409,
    );
  }

  return null;
}

export function toClientError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  const mapped = mapPrismaError(error);
  if (mapped) {
    return mapped;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return new AppError("OPERATION_FAILED", "Operation failed", 400);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new AppError("OPERATION_FAILED", "Invalid data provided", 400);
  }

  if (error instanceof Error) {
    return new AppError("OPERATION_FAILED", error.message, 400);
  }

  return new AppError("OPERATION_FAILED", "Operation failed", 400);
}
