import type { RoleName } from "../constants/roles.js";
import type { DepartmentSummary } from "./auth.js";

export type UserDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  department: DepartmentSummary | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserRequest = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  departmentId: string | null;
};

export type UpdateUserRequest = {
  firstName?: string;
  lastName?: string;
  role?: RoleName;
  departmentId?: string | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedUsers = {
  items: UserDto[];
  meta: PaginationMeta;
};
