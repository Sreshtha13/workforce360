export type WorkflowCondition = {
  field: string;
  operator: string;
  value: string;
};

function getFieldValue(metadata: Record<string, unknown>, field: string): unknown {
  if (!field.includes(".")) return metadata[field];
  return field.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, metadata);
}

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fall through
  }
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

/** Evaluate a single workflow condition against request metadata. */
export function matchesCondition(
  condition: WorkflowCondition,
  metadata: Record<string, unknown>,
): boolean {
  const raw = getFieldValue(metadata, condition.field);
  const left = raw == null ? "" : String(raw);
  const right = condition.value;
  const leftNum = Number(left);
  const rightNum = Number(right);
  const bothNumeric = !Number.isNaN(leftNum) && !Number.isNaN(rightNum) && left !== "" && right !== "";

  switch (condition.operator) {
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "gt":
      return bothNumeric ? leftNum > rightNum : left > right;
    case "gte":
      return bothNumeric ? leftNum >= rightNum : left >= right;
    case "lt":
      return bothNumeric ? leftNum < rightNum : left < right;
    case "lte":
      return bothNumeric ? leftNum <= rightNum : left <= right;
    case "in":
      return parseList(right).includes(left);
    default:
      return false;
  }
}

/** All conditions on a workflow must match (AND). Empty conditions always match. */
export function matchesAllConditions(
  conditions: WorkflowCondition[],
  metadata: Record<string, unknown>,
): boolean {
  if (conditions.length === 0) return true;
  return conditions.every((c) => matchesCondition(c, metadata));
}
