export type EmployeeTypeRef = {
  id: string;
  name: string;
  code: string;
};

export function formatEmployeeType(
  type: Pick<EmployeeTypeRef, "code" | "name"> | null | undefined,
): string {
  if (!type) return "—";
  if (type.code && type.name) return `${type.code} - ${type.name}`;
  return type.name || type.code || "—";
}
