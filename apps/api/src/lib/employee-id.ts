const EMPLOYEE_ID_PATTERN = /^EMP(\d+)$/i;

/** Format numeric sequence as EMP001, EMP002, … */
export function formatEmployeeId(sequence: number): string {
  return `EMP${String(sequence).padStart(3, "0")}`;
}

/** Parse numeric suffix from EMP### ids; returns null if format doesn't match */
export function parseEmployeeIdSequence(employeeId: string): number | null {
  const match = employeeId.trim().match(EMPLOYEE_ID_PATTERN);
  if (!match) return null;
  return parseInt(match[1], 10);
}

/** Given the highest existing EMP id (or null), return the next id */
export function getNextEmployeeId(latestEmployeeId: string | null): string {
  if (!latestEmployeeId) {
    return formatEmployeeId(1);
  }
  const sequence = parseEmployeeIdSequence(latestEmployeeId);
  if (sequence === null) {
    return formatEmployeeId(1);
  }
  return formatEmployeeId(sequence + 1);
}

/** Find the highest numeric sequence among a list of employee ids */
export function findHighestEmployeeId(employeeIds: (string | null | undefined)[]): string | null {
  let maxSequence = 0;
  let latestFormatted: string | null = null;

  for (const id of employeeIds) {
    if (!id) continue;
    const sequence = parseEmployeeIdSequence(id);
    if (sequence !== null && sequence > maxSequence) {
      maxSequence = sequence;
      latestFormatted = id;
    }
  }

  return latestFormatted;
}
