import type { Prisma } from "@prisma/client";
import type {
  ListEmployeesQueryInput,
  UpdateEmployeeInput,
} from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import {
  employeeInclude,
  toEmployeeDto,
} from "../../shared/utils/employee-mapper.js";
import { employeesRepository } from "./employees.repository.js";

type Actor = AuthenticatedUser;

function buildScope(actor: Actor): Prisma.EmployeeWhereInput {
  if (actor.role === "HR_ADMIN") {
    return {};
  }

  if (actor.role === "RECRUITER") {
    return { requisition: { createdById: actor.id } };
  }

  if (actor.role === "HIRING_MANAGER") {
    return { requisition: { hiringManagerId: actor.id } };
  }

  throw new ForbiddenError("You do not have access to employees");
}

function assertCanManage(actor: Actor) {
  if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
    return;
  }

  throw new ForbiddenError("You do not have access to manage employees");
}

async function getScopedEmployee(id: string, actor: Actor) {
  const employee = await employeesRepository.findById(id);
  if (!employee) {
    throw new NotFoundError("Employee not found");
  }

  const scope = buildScope(actor);
  const scoped = await prisma.employee.findFirst({
    where: {
      id: employee.id,
      ...scope,
    },
    include: employeeInclude,
  });

  if (!scoped) {
    throw new ForbiddenError("You do not have access to this employee");
  }

  return scoped;
}

export const employeesService = {
  async list(query: ListEmployeesQueryInput, actor: Actor) {
    const scope = buildScope(actor);
    const [items, total] = await employeesRepository.findMany(query, scope);

    return {
      items: items.map(toEmployeeDto),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string, actor: Actor) {
    const employee = await getScopedEmployee(id, actor);
    return toEmployeeDto(employee);
  },

  async update(id: string, input: UpdateEmployeeInput, actor: Actor) {
    assertCanManage(actor);
    const employee = await getScopedEmployee(id, actor);

    if (employee.status !== "ONBOARDING" && employee.status !== "JOINED") {
      throw new BadRequestError(
        "Only onboarding employees can be edited",
        "READ_ONLY_EMPLOYEE",
      );
    }

    const updated = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        fullName: input.fullName,
        email: input.email?.toLowerCase(),
        phone: input.phone,
        workEmail: input.workEmail,
        jobTitle: input.jobTitle,
        expectedJoiningDate: input.expectedJoiningDate
          ? new Date(`${input.expectedJoiningDate}T00:00:00`)
          : undefined,
        baseSalary: input.baseSalary,
        currency: input.currency,
        updatedById: actor.id,
      },
      include: employeeInclude,
    });

    return toEmployeeDto(updated);
  },
};
