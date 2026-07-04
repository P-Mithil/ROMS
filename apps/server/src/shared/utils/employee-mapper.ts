import type { Department, Employee, JobRequisition, User } from "@prisma/client";
import type { EmployeeDto, EmployeeStatus } from "@roms/shared";
import type { UserSummary } from "@roms/shared";

function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export type EmployeeWithRelations = Employee & {
  department: Department;
  hiringManager: User;
  createdBy: User;
  updatedBy: User | null;
};

export function toEmployeeDto(employee: EmployeeWithRelations): EmployeeDto {
  return {
    id: employee.id,
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    email: employee.email,
    phone: employee.phone,
    workEmail: employee.workEmail,
    jobTitle: employee.jobTitle,
    department: {
      id: employee.department.id,
      name: employee.department.name,
    },
    employmentType: employee.employmentType,
    workMode: employee.workMode,
    baseSalary: employee.baseSalary,
    currency: employee.currency,
    expectedJoiningDate: employee.expectedJoiningDate
      .toISOString()
      .slice(0, 10),
    actualJoiningDate: employee.actualJoiningDate
      ? employee.actualJoiningDate.toISOString().slice(0, 10)
      : null,
    hiringManager: toUserSummary(employee.hiringManager),
    candidateId: employee.candidateId,
    offerId: employee.offerId,
    requisitionId: employee.requisitionId,
    status: employee.status as EmployeeStatus,
    createdBy: toUserSummary(employee.createdBy),
    updatedBy: employee.updatedBy ? toUserSummary(employee.updatedBy) : null,
    createdAt: employee.createdAt.toISOString(),
    updatedAt: employee.updatedAt.toISOString(),
  };
}

export const employeeInclude = {
  department: true,
  hiringManager: true,
  createdBy: true,
  updatedBy: true,
} as const;

export type EmployeeWithRequisitionScope = Employee & {
  requisition: Pick<JobRequisition, "createdById" | "hiringManagerId">;
};
