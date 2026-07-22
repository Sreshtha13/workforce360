export function isSuperAdmin(
  user: { roles: { code?: string | null }[] } | null | undefined,
): boolean {
  return user?.roles.some((role) => role.code === "super_admin") ?? false;
}
