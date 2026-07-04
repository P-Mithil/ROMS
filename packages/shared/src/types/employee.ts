import type { EmployeeStatus } from "../constants/employee-status.js";
import type { EmploymentType, WorkMode } from "../constants/requisition-metadata.js";
import type { UserSummary } from "./requisition.js";

export type EmployeeDto = {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  workEmail: string | null;
  jobTitle: string;
  department: { id: string; name: string };
  employmentType: EmploymentType;
  workMode: WorkMode;
  baseSalary: number;
  currency: string;
  expectedJoiningDate: string;
  actualJoiningDate: string | null;
  hiringManager: UserSummary;
  candidateId: string;
  offerId: string;
  requisitionId: string;
  status: EmployeeStatus;
  createdBy: UserSummary;
  updatedBy: UserSummary | null;
  createdAt: string;
  updatedAt: string;
};

export type UpdateEmployeeRequest = {
  fullName?: string;
  email?: string;
  phone?: string;
  workEmail?: string | null;
  jobTitle?: string;
  expectedJoiningDate?: string;
  baseSalary?: number;
  currency?: string;
};

export type ListEmployeesQuery = {
  page: number;
  limit: number;
  status?: EmployeeStatus;
  departmentId?: string;
  requisitionId?: string;
  search?: string;
};

export type PaginatedEmployees = {
  items: EmployeeDto[];
  meta: import("./user.js").PaginationMeta;
};
