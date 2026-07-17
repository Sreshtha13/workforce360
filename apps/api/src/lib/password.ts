import bcrypt from "bcrypt";
import { env } from "./env";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export type PasswordValidationResult = {
  isValid: boolean;
  errors: string[];
};

export function validatePasswordPolicy(
  password: string,
): PasswordValidationResult {
  const errors: string[] = [];
  
  if (password.length < env.PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${env.PASSWORD_MIN_LENGTH} characters long`);
  }
  
  if (env.PASSWORD_REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  
  if (env.PASSWORD_REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  
  if (env.PASSWORD_REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  
  if (env.PASSWORD_REQUIRE_SPECIAL && !/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
