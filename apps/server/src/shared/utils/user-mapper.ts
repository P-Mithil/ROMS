import type { RoleName, AuthUser, DepartmentSummary } from "@roms/shared";
import type { Department, Role, User } from "@prisma/client";

type UserWithRelations = User & {
  role: Role;
  department: Department | null;
};

export function toDepartmentSummary(
  department: Department | null,
): DepartmentSummary | null {
  if (!department) {
    return null;
  }

  return {
    id: department.id,
    name: department.name,
  };
}

export function toAuthUser(user: UserWithRelations): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name as RoleName,
    department: toDepartmentSummary(user.department),
  };
}

export function toAuthenticatedUser(user: UserWithRelations) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name as RoleName,
    departmentId: user.departmentId,
    isActive: user.isActive,
  };
}

export const userInclude = {
  role: true,
  department: true,
} as const;
