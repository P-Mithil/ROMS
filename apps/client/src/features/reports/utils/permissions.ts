import type { AuthUser } from "@roms/shared";

export function canAccessReports(user: AuthUser): boolean {
  return (
    user.role === "HR_ADMIN" ||
    user.role === "RECRUITER" ||
    user.role === "HIRING_MANAGER"
  );
}
