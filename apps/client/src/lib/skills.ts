export function parseSkills(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

export function stringifySkills(values: string[]): string | undefined {
  const normalized = Array.from(
    new Set(
      values
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
  );

  return normalized.length > 0 ? normalized.join(", ") : undefined;
}
