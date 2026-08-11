/** Bump semver-like version strings (e.g. 1.0 → 1.1, 2 → 2.1). */
export function bumpPolicyVersion(version: string): string {
  const trimmed = version.trim();
  const match = trimmed.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) {
    return `${trimmed}.1`;
  }
  const major = parseInt(match[1], 10);
  const minor = match[2] ? parseInt(match[2], 10) : 0;
  return `${major}.${minor + 1}`;
}
