export function getRouteParam(
  params: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = params[name];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return "";
}
