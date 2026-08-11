/** Sanitize department code/name into an uppercase alphanumeric prefix (max 10). */
export function departmentPrefix(department: { code?: string | null; name: string }): string {
  const fromCode = (department.code ?? "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (fromCode.length > 0) {
    return fromCode.slice(0, 10);
  }

  const fromName = department.name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (fromName.length >= 3) {
    return fromName.slice(0, 3);
  }
  if (fromName.length > 0) {
    return fromName.padEnd(3, "X");
  }
  return "DES";
}

export function formatDesignationCode(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

/** Parse numeric suffix from PREFIX-NNN; returns null if format doesn't match. */
export function parseDesignationCodeSequence(code: string, prefix: string): number | null {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = code.trim().match(new RegExp(`^${escaped}-(\\d+)$`, "i"));
  if (!match) return null;
  return parseInt(match[1], 10);
}

/** Highest matching PREFIX-NNN sequence among codes (0 if none). */
export function findHighestDesignationSequence(
  codes: (string | null | undefined)[],
  prefix: string,
): number {
  let max = 0;
  for (const code of codes) {
    if (!code) continue;
    const sequence = parseDesignationCodeSequence(code, prefix);
    if (sequence !== null && sequence > max) {
      max = sequence;
    }
  }
  return max;
}

export function normalizeDesignationCode(code: string): string {
  return code.trim().toUpperCase();
}
