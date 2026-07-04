import type { RoleName } from "../constants/roles.js";

export type DepartmentSummary = {
  id: string;
  name: string;
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  department: DepartmentSummary | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type RefreshResponse = {
  accessToken: string;
  expiresIn: number;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};
