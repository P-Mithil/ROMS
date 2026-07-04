import type { Prisma } from "@prisma/client";
import type { ListEmployeesQueryInput } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import { employeeInclude } from "../../shared/utils/employee-mapper.js";

function buildWhere(
  query: ListEmployeesQueryInput,
  scope: Prisma.EmployeeWhereInput,
): Prisma.EmployeeWhereInput {
  const where: Prisma.EmployeeWhereInput = {
    ...scope,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.departmentId) {
    where.departmentId = query.departmentId;
  }

  if (query.requisitionId) {
    where.requisitionId = query.requisitionId;
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { employeeCode: { contains: query.search, mode: "insensitive" } },
      { jobTitle: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
}

export const employeesRepository = {
  findMany(query: ListEmployeesQueryInput, scope: Prisma.EmployeeWhereInput) {
    const where = buildWhere(query, scope);
    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.employee.findMany({
        where,
        include: employeeInclude,
        orderBy: [{ createdAt: "desc" }],
        skip,
        take: query.limit,
      }),
      prisma.employee.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.employee.findUnique({
      where: { id },
      include: employeeInclude,
    });
  },
};
