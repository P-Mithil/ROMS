import type { AuthUser } from "@roms/shared";

export function canUseAi(user: AuthUser | null | undefined): boolean {
  return user?.role === "HR_ADMIN" || user?.role === "RECRUITER";
}
