import { Prisma } from "@prisma/client";
import type {
  CloseRequisitionInput,
  CreateRequisitionInput,
  ListRequisitionsQuery,
  RequisitionListSummary,
  RejectRequisitionInput,
  UpdateRequisitionInput,
} from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import { toRequisitionDto } from "../../shared/utils/requisition-mapper.js";
import { requisitionsRepository } from "./requisitions.repository.js";

type Actor = AuthenticatedUser;

async function validateDepartment(departmentId: string) {
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department || !department.isActive) {
    throw new BadRequestError("Department not found or inactive");
  }

  return department;
}

async function validateHiringManager(hiringManagerId: string) {
  const user = await prisma.user.findUnique({
    where: { id: hiringManagerId },
    include: { role: true },
  });

  if (!user || !user.isActive) {
    throw new BadRequestError("Hiring manager not found or inactive");
  }

  if (user.role.name !== "HIRING_MANAGER") {
    throw new BadRequestError("Selected user must have the Hiring Manager role");
  }

  return user;
}

function buildListScope(actor: Actor) {
  if (actor.role === "HR_ADMIN") {
    return {};
  }

  if (actor.role === "RECRUITER") {
    return { createdById: actor.id };
  }

  if (actor.role === "HIRING_MANAGER") {
    return { hiringManagerId: actor.id };
  }

  throw new ForbiddenError("You do not have access to requisitions");
}

function assertCanView(requisition: { createdById: string; hiringManagerId: string }, actor: Actor) {
  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (actor.role === "RECRUITER" && requisition.createdById === actor.id) {
    return;
  }

  if (actor.role === "HIRING_MANAGER" && requisition.hiringManagerId === actor.id) {
    return;
  }

  throw new ForbiddenError("You do not have access to this requisition");
}

function assertCanEdit(requisition: { createdById: string; status: string }, actor: Actor) {
  if (requisition.status === "OPEN") {
    throw new BadRequestError(
      "OPEN requisitions only allow description updates",
      "INVALID_STATUS",
    );
  }

  if (requisition.status !== "DRAFT" && requisition.status !== "REJECTED") {
    throw new BadRequestError(
      "Only DRAFT or REJECTED requisitions can be edited",
      "INVALID_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (actor.role === "RECRUITER" && requisition.createdById === actor.id) {
    return;
  }

  throw new ForbiddenError("You cannot edit this requisition");
}

function assertCanEditOpenDescription(
  requisition: { createdById: string; hiringManagerId: string; status: string },
  actor: Actor,
) {
  if (requisition.status !== "OPEN") {
    throw new BadRequestError(
      "Only OPEN requisitions support description-only edits",
      "INVALID_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (actor.role === "RECRUITER" && requisition.createdById === actor.id) {
    return;
  }

  if (actor.role === "HIRING_MANAGER" && requisition.hiringManagerId === actor.id) {
    return;
  }

  throw new ForbiddenError("You cannot edit this requisition");
}

function assertCanSubmit(requisition: { createdById: string; status: string }, actor: Actor) {
  if (requisition.status !== "DRAFT" && requisition.status !== "REJECTED") {
    throw new BadRequestError(
      "Only DRAFT or REJECTED requisitions can be submitted",
      "INVALID_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (actor.role === "RECRUITER" && requisition.createdById === actor.id) {
    return;
  }

  throw new ForbiddenError("You cannot submit this requisition");
}

function assertCanApproveOrReject(
  requisition: { hiringManagerId: string; status: string },
  actor: Actor,
) {
  if (requisition.status !== "PENDING_APPROVAL") {
    throw new BadRequestError(
      "Only PENDING_APPROVAL requisitions can be approved or rejected",
      "INVALID_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (actor.role === "HIRING_MANAGER" && requisition.hiringManagerId === actor.id) {
    return;
  }

  throw new ForbiddenError("You cannot approve or reject this requisition");
}

function assertCanClose(
  requisition: { createdById: string; hiringManagerId: string; status: string },
  actor: Actor,
) {
  if (requisition.status !== "OPEN") {
    throw new BadRequestError(
      "Only OPEN requisitions can be closed",
      "INVALID_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (actor.role === "RECRUITER" && requisition.createdById === actor.id) {
    return;
  }

  if (actor.role === "HIRING_MANAGER" && requisition.hiringManagerId === actor.id) {
    return;
  }

  throw new ForbiddenError("You cannot close this requisition");
}

function assertCanDelete(requisition: { createdById: string; status: string }, actor: Actor) {
  if (requisition.status !== "DRAFT") {
    throw new BadRequestError(
      "Only DRAFT requisitions can be deleted",
      "INVALID_STATUS",
    );
  }

  if (actor.role === "HR_ADMIN") {
    return;
  }

  if (actor.role === "RECRUITER" && requisition.createdById === actor.id) {
    return;
  }

  throw new ForbiddenError("You cannot delete this requisition");
}

export const requisitionsService = {
  async list(query: ListRequisitionsQuery, actor: Actor) {
    const scope = buildListScope(actor);
    const [
      items,
      total,
      summaryTotal,
      open,
      pendingApproval,
      closed,
      openingsAggregate,
      totalCandidates,
      totalShortlisted,
    ] =
      await requisitionsRepository.findMany(query, scope);

    return {
      items: items.map(toRequisitionDto),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        total: summaryTotal,
        open,
        pendingApproval,
        closed,
        totalOpenings: openingsAggregate._sum.openings ?? 0,
        totalCandidates,
        totalShortlisted,
      } satisfies RequisitionListSummary,
    };
  },

  async getById(id: string, actor: Actor) {
    const requisition = await requisitionsRepository.findById(id);
    if (!requisition) {
      throw new NotFoundError("Requisition not found");
    }

    assertCanView(requisition, actor);
    return toRequisitionDto(requisition);
  },

  async create(input: CreateRequisitionInput, actor: Actor) {
    await validateDepartment(input.departmentId);
    await validateHiringManager(input.hiringManagerId);

    const requisition = await requisitionsRepository.create({
      title: input.title,
      description: input.description ?? null,
      skills: input.skills ?? null,
      departmentId: input.departmentId,
      hiringManagerId: input.hiringManagerId,
      createdById: actor.id,
      hiringPriority: input.hiringPriority,
      openings: input.openings,
      employmentType: input.employmentType,
      workMode: input.workMode,
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      experienceMin:
        input.experienceMin !== undefined
          ? new Prisma.Decimal(input.experienceMin)
          : null,
      experienceMax:
        input.experienceMax !== undefined
          ? new Prisma.Decimal(input.experienceMax)
          : null,
    });

    return toRequisitionDto(requisition);
  },

  async update(id: string, input: UpdateRequisitionInput, actor: Actor) {
    const existing = await requisitionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Requisition not found");
    }

    if (existing.status === "OPEN") {
      assertCanEditOpenDescription(existing, actor);

      const inputKeys = Object.keys(input);
      const onlyDescription =
        inputKeys.length === 1 && input.description !== undefined;

      if (!onlyDescription) {
        throw new BadRequestError(
          "Only description can be updated for OPEN requisitions",
          "INVALID_STATUS",
        );
      }
    } else {
      assertCanEdit(existing, actor);
    }

    if (input.departmentId) {
      await validateDepartment(input.departmentId);
    }

    if (input.hiringManagerId) {
      await validateHiringManager(input.hiringManagerId);
    }

    const requisition = await requisitionsRepository.update(id, {
      ...input,
      experienceMin:
        input.experienceMin !== undefined
          ? input.experienceMin === null
            ? null
            : new Prisma.Decimal(input.experienceMin)
          : undefined,
      experienceMax:
        input.experienceMax !== undefined
          ? input.experienceMax === null
            ? null
            : new Prisma.Decimal(input.experienceMax)
          : undefined,
    });
    return toRequisitionDto(requisition);
  },

  async submit(id: string, actor: Actor) {
    const existing = await requisitionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Requisition not found");
    }

    assertCanSubmit(existing, actor);

    const requisition = await requisitionsRepository.update(id, {
      status: "PENDING_APPROVAL",
      submittedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
    });

    return toRequisitionDto(requisition);
  },

  async approve(id: string, actor: Actor) {
    const existing = await requisitionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Requisition not found");
    }

    assertCanApproveOrReject(existing, actor);

    const requisition = await requisitionsRepository.update(id, {
      status: "OPEN",
      approvedById: actor.id,
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
    });

    return toRequisitionDto(requisition);
  },

  async reject(id: string, input: RejectRequisitionInput, actor: Actor) {
    const existing = await requisitionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Requisition not found");
    }

    assertCanApproveOrReject(existing, actor);

    const requisition = await requisitionsRepository.update(id, {
      status: "REJECTED",
      rejectedAt: new Date(),
      rejectionReason: input.reason,
      approvedById: null,
      approvedAt: null,
    });

    return toRequisitionDto(requisition);
  },

  async close(id: string, input: CloseRequisitionInput, actor: Actor) {
    const existing = await requisitionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Requisition not found");
    }

    assertCanClose(existing, actor);

    const requisition = await requisitionsRepository.update(id, {
      status: "CLOSED",
      closedById: actor.id,
      closedAt: new Date(),
      closeReason: input.reason,
    });

    return toRequisitionDto(requisition);
  },

  async delete(id: string, actor: Actor) {
    const existing = await requisitionsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Requisition not found");
    }

    assertCanDelete(existing, actor);

    await requisitionsRepository.update(id, {
      deletedAt: new Date(),
    });
  },
};
