import type {
  OnboardingDocument,
  OnboardingTask,
  OnboardingTaskOwner,
  OnboardingTaskPhase,
  Prisma,
} from "@prisma/client";
import type {
  CancelOnboardingInput,
  ConfirmJoiningInput,
  ListOnboardingQueryInput,
  SkipOnboardingTaskInput,
  StartOnboardingInput,
  UpdateOnboardingTaskInput,
  WaiveOnboardingDocumentInput,
} from "@roms/shared";
import {
  DEFAULT_ONBOARDING_DOCUMENTS,
  DEFAULT_ONBOARDING_TASKS,
} from "@roms/shared";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../db/prisma.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import {
  onboardingCaseInclude,
  toOnboardingCaseDto,
} from "../../shared/utils/onboarding-mapper.js";
import { onboardingRepository } from "./onboarding.repository.js";

type Actor = AuthenticatedUser;

function buildScope(actor: Actor): Prisma.OnboardingCaseWhereInput {
  if (actor.role === "HR_ADMIN") {
    return {};
  }

  if (actor.role === "RECRUITER") {
    return { requisition: { createdById: actor.id } };
  }

  if (actor.role === "HIRING_MANAGER") {
    return { requisition: { hiringManagerId: actor.id } };
  }

  throw new ForbiddenError("You do not have access to onboarding");
}

function assertCanManage(actor: Actor) {
  if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
    return;
  }

  throw new ForbiddenError("You do not have access to manage onboarding");
}

function assertCanComplete(actor: Actor) {
  if (actor.role === "HR_ADMIN") {
    return;
  }

  throw new ForbiddenError("Only HR admins can complete onboarding");
}

function assertCanCancel(actor: Actor) {
  assertCanComplete(actor);
}

async function getScopedCase(id: string, actor: Actor) {
  const onboardingCase = await onboardingRepository.findById(id);
  if (!onboardingCase) {
    throw new NotFoundError("Onboarding case not found");
  }

  const scope = buildScope(actor);
  const scoped = await prisma.onboardingCase.findFirst({
    where: {
      id: onboardingCase.id,
      ...scope,
    },
    include: onboardingCaseInclude,
  });

  if (!scoped) {
    throw new ForbiddenError("You do not have access to this onboarding case");
  }

  return scoped;
}

function assertTaskPhaseAllowed(
  onboardingCase: { status: string },
  phase: OnboardingTaskPhase,
) {
  if (phase === "POST_JOINING" && onboardingCase.status !== "JOINED") {
    throw new BadRequestError(
      "Post-joining tasks can only be updated after joining is confirmed",
      "INVALID_ONBOARDING_PHASE",
    );
  }

  if (
    phase === "PRE_JOINING" &&
    onboardingCase.status !== "IN_PROGRESS" &&
    onboardingCase.status !== "JOINED"
  ) {
    throw new BadRequestError(
      "Tasks cannot be updated in the current onboarding status",
      "INVALID_ONBOARDING_STATUS",
    );
  }
}

function assertTaskOwner(
  ownerRole: OnboardingTaskOwner,
  actor: Actor,
  hiringManagerId: string,
) {
  if (ownerRole === "IT") {
    if (actor.role !== "HR_ADMIN") {
      throw new ForbiddenError("Only HR admins can complete IT onboarding tasks");
    }
    return;
  }

  if (ownerRole === "HIRING_MANAGER") {
    if (
      actor.role === "HR_ADMIN" ||
      (actor.role === "HIRING_MANAGER" && actor.id === hiringManagerId)
    ) {
      return;
    }
    throw new ForbiddenError(
      "Only the assigned hiring manager can complete this task",
    );
  }

  if (ownerRole === "HR") {
    if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
      return;
    }
    throw new ForbiddenError("You do not have access to complete this task");
  }
}

function isTaskDone(status: OnboardingTask["status"]) {
  return status === "COMPLETED" || status === "SKIPPED";
}

function isDocumentReady(status: OnboardingDocument["status"]) {
  return status === "VERIFIED" || status === "WAIVED";
}

function assertCompletionGates(
  onboardingCase: {
    status: string;
    tasks: OnboardingTask[];
    documents: OnboardingDocument[];
  },
) {
  if (onboardingCase.status !== "JOINED") {
    throw new BadRequestError(
      "Joining must be confirmed before onboarding can be completed",
      "JOINING_NOT_CONFIRMED",
    );
  }

  const incompleteRequiredTasks = onboardingCase.tasks.filter(
    (task) => task.isRequired && !isTaskDone(task.status),
  );

  if (incompleteRequiredTasks.length > 0) {
    throw new BadRequestError(
      "All required onboarding tasks must be completed or skipped",
      "INCOMPLETE_TASKS",
    );
  }

  const incompleteRequiredDocuments = onboardingCase.documents.filter(
    (document) => document.isRequired && !isDocumentReady(document.status),
  );

  if (incompleteRequiredDocuments.length > 0) {
    throw new BadRequestError(
      "All required documents must be verified or waived",
      "INCOMPLETE_DOCUMENTS",
    );
  }
}

async function generateEmployeeCode(tx: Prisma.TransactionClient) {
  const year = new Date().getFullYear();
  const prefix = `EMP-${year}-`;
  const latest = await tx.employee.findFirst({
    where: {
      employeeCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      employeeCode: "desc",
    },
  });

  const nextNumber = latest
    ? Number.parseInt(latest.employeeCode.slice(-4), 10) + 1
    : 1;

  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

async function seedChecklist(tx: Prisma.TransactionClient, onboardingCaseId: string) {
  await tx.onboardingTask.createMany({
    data: DEFAULT_ONBOARDING_TASKS.map((task) => ({
      onboardingCaseId,
      title: task.title,
      description: task.description ?? null,
      phase: task.phase,
      ownerRole: task.ownerRole,
      isRequired: task.isRequired ?? true,
      sortOrder: task.sortOrder,
    })),
  });

  await tx.onboardingDocument.createMany({
    data: DEFAULT_ONBOARDING_DOCUMENTS.map((document) => ({
      onboardingCaseId,
      documentType: document.documentType,
      isRequired: document.isRequired ?? true,
    })),
  });
}

export const onboardingService = {
  async list(query: ListOnboardingQueryInput, actor: Actor) {
    const scope = buildScope(actor);
    const [items, total] = await onboardingRepository.findMany(query, scope);

    return {
      items: items.map(toOnboardingCaseDto),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string, actor: Actor) {
    const onboardingCase = await getScopedCase(id, actor);
    return toOnboardingCaseDto(onboardingCase);
  },

  async start(id: string, input: StartOnboardingInput, actor: Actor) {
    assertCanManage(actor);
    const onboardingCase = await getScopedCase(id, actor);

    if (onboardingCase.status !== "PENDING") {
      throw new BadRequestError(
        "Only pending onboarding cases can be started",
        "INVALID_ONBOARDING_STATUS",
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: onboardingCase.offerId },
      include: {
        candidate: true,
        requisition: true,
      },
    });

    if (!offer || offer.deletedAt) {
      throw new NotFoundError("Offer not found");
    }

    if (offer.status !== "ACCEPTED") {
      throw new BadRequestError(
        "Onboarding can only be started for accepted offers",
        "INVALID_OFFER_STATUS",
      );
    }

    const existingEmployee = await prisma.employee.findUnique({
      where: { candidateId: offer.candidateId },
    });

    if (existingEmployee) {
      throw new ConflictError("This candidate already has an employee record");
    }

    const fullName = input.fullName ?? offer.candidate.fullName;
    const email = (input.email ?? offer.candidate.email).toLowerCase();
    const phone = input.phone ?? offer.candidate.phone;
    const jobTitle = input.jobTitle ?? offer.jobTitle;
    const departmentId = input.departmentId ?? offer.requisition.departmentId;
    const expectedJoiningDate = input.expectedJoiningDate
      ? new Date(`${input.expectedJoiningDate}T00:00:00`)
      : offer.joiningDate;
    const baseSalary = input.baseSalary ?? offer.baseSalary;
    const currency = input.currency ?? offer.currency;

    const updated = await prisma.$transaction(async (tx) => {
      const employeeCode = await generateEmployeeCode(tx);

      const employee = await tx.employee.create({
        data: {
          employeeCode,
          fullName,
          email,
          phone,
          workEmail: input.workEmail ?? null,
          jobTitle,
          departmentId,
          employmentType: offer.employmentType,
          workMode: offer.workMode,
          baseSalary,
          currency,
          expectedJoiningDate,
          hiringManagerId: offer.requisition.hiringManagerId,
          candidateId: offer.candidateId,
          offerId: offer.id,
          requisitionId: offer.requisitionId,
          status: "ONBOARDING",
          createdById: actor.id,
          updatedById: actor.id,
        },
      });

      await seedChecklist(tx, onboardingCase.id);

      return tx.onboardingCase.update({
        where: { id: onboardingCase.id },
        data: {
          status: "IN_PROGRESS",
          employeeId: employee.id,
          startedAt: new Date(),
          startedById: actor.id,
        },
        include: onboardingCaseInclude,
      });
    });

    return toOnboardingCaseDto(updated);
  },

  async confirmJoining(
    id: string,
    input: ConfirmJoiningInput,
    actor: Actor,
  ) {
    assertCanManage(actor);
    const onboardingCase = await getScopedCase(id, actor);

    if (onboardingCase.status !== "IN_PROGRESS") {
      throw new BadRequestError(
        "Only in-progress onboarding cases can confirm joining",
        "INVALID_ONBOARDING_STATUS",
      );
    }

    if (!onboardingCase.employeeId) {
      throw new BadRequestError(
        "Employee record is required before joining can be confirmed",
        "EMPLOYEE_NOT_FOUND",
      );
    }

    const actualJoiningDate = new Date(`${input.actualJoiningDate}T00:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (actualJoiningDate > today) {
      throw new BadRequestError(
        "Actual joining date cannot be in the future",
        "INVALID_JOINING_DATE",
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: onboardingCase.employeeId! },
        data: {
          status: "JOINED",
          actualJoiningDate,
          updatedById: actor.id,
        },
      });

      await tx.candidate.update({
        where: { id: onboardingCase.candidateId },
        data: {
          status: "JOINED",
          updatedById: actor.id,
        },
      });

      return tx.onboardingCase.update({
        where: { id: onboardingCase.id },
        data: {
          status: "JOINED",
          joinedAt: new Date(),
          joinedById: actor.id,
        },
        include: onboardingCaseInclude,
      });
    });

    return toOnboardingCaseDto(updated);
  },

  async complete(id: string, actor: Actor) {
    assertCanComplete(actor);
    const onboardingCase = await getScopedCase(id, actor);
    assertCompletionGates(onboardingCase);

    if (!onboardingCase.employeeId) {
      throw new BadRequestError(
        "Employee record is required before onboarding can be completed",
        "EMPLOYEE_NOT_FOUND",
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id: onboardingCase.employeeId! },
        data: {
          status: "ACTIVE",
          updatedById: actor.id,
        },
      });

      await tx.candidate.update({
        where: { id: onboardingCase.candidateId },
        data: {
          status: "ONBOARDED",
          updatedById: actor.id,
        },
      });

      return tx.onboardingCase.update({
        where: { id: onboardingCase.id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
          completedById: actor.id,
        },
        include: onboardingCaseInclude,
      });
    });

    return toOnboardingCaseDto(updated);
  },

  async cancel(id: string, input: CancelOnboardingInput, actor: Actor) {
    assertCanCancel(actor);
    const onboardingCase = await getScopedCase(id, actor);

    if (
      onboardingCase.status === "COMPLETED" ||
      onboardingCase.status === "CANCELLED"
    ) {
      throw new BadRequestError(
        "This onboarding case cannot be cancelled",
        "INVALID_ONBOARDING_STATUS",
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (onboardingCase.employeeId) {
        await tx.employee.update({
          where: { id: onboardingCase.employeeId },
          data: {
            status: "WITHDRAWN",
            updatedById: actor.id,
          },
        });
      }

      await tx.candidate.update({
        where: { id: onboardingCase.candidateId },
        data: {
          status: "WITHDRAWN",
          updatedById: actor.id,
        },
      });

      return tx.onboardingCase.update({
        where: { id: onboardingCase.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: input.reason,
        },
        include: onboardingCaseInclude,
      });
    });

    return toOnboardingCaseDto(updated);
  },

  async updateTask(
    caseId: string,
    taskId: string,
    input: UpdateOnboardingTaskInput,
    actor: Actor,
  ) {
    const onboardingCase = await getScopedCase(caseId, actor);
    const task = onboardingCase.tasks.find((item) => item.id === taskId);

    if (!task) {
      throw new NotFoundError("Onboarding task not found");
    }

    if (task.status === "COMPLETED" || task.status === "SKIPPED") {
      throw new BadRequestError(
        "Completed or skipped tasks cannot be updated",
        "READ_ONLY_TASK",
      );
    }

    assertTaskPhaseAllowed(onboardingCase, task.phase);
    assertTaskOwner(
      task.ownerRole,
      actor,
      onboardingCase.requisition.hiringManagerId,
    );

    const updatedCase = await prisma.onboardingCase.update({
      where: { id: onboardingCase.id },
      data: {
        tasks: {
          update: {
            where: { id: task.id },
            data: {
              status: input.status,
              notes: input.notes,
            },
          },
        },
      },
      include: onboardingCaseInclude,
    });

    return toOnboardingCaseDto(updatedCase);
  },

  async completeTask(caseId: string, taskId: string, actor: Actor) {
    const onboardingCase = await getScopedCase(caseId, actor);
    const task = onboardingCase.tasks.find((item) => item.id === taskId);

    if (!task) {
      throw new NotFoundError("Onboarding task not found");
    }

    if (task.status === "COMPLETED" || task.status === "SKIPPED") {
      throw new BadRequestError(
        "This task has already been finalized",
        "READ_ONLY_TASK",
      );
    }

    assertTaskPhaseAllowed(onboardingCase, task.phase);
    assertTaskOwner(
      task.ownerRole,
      actor,
      onboardingCase.requisition.hiringManagerId,
    );

    const updatedCase = await prisma.onboardingCase.update({
      where: { id: onboardingCase.id },
      data: {
        tasks: {
          update: {
            where: { id: task.id },
            data: {
              status: "COMPLETED",
              completedAt: new Date(),
              completedById: actor.id,
            },
          },
        },
      },
      include: onboardingCaseInclude,
    });

    return toOnboardingCaseDto(updatedCase);
  },

  async skipTask(
    caseId: string,
    taskId: string,
    input: SkipOnboardingTaskInput,
    actor: Actor,
  ) {
    assertCanManage(actor);
    const onboardingCase = await getScopedCase(caseId, actor);
    const task = onboardingCase.tasks.find((item) => item.id === taskId);

    if (!task) {
      throw new NotFoundError("Onboarding task not found");
    }

    if (task.status === "COMPLETED" || task.status === "SKIPPED") {
      throw new BadRequestError(
        "This task has already been finalized",
        "READ_ONLY_TASK",
      );
    }

    assertTaskPhaseAllowed(onboardingCase, task.phase);

    if (task.isRequired && actor.role !== "HR_ADMIN") {
      throw new ForbiddenError("Only HR admins can skip required tasks");
    }

    const updatedCase = await prisma.onboardingCase.update({
      where: { id: onboardingCase.id },
      data: {
        tasks: {
          update: {
            where: { id: task.id },
            data: {
              status: "SKIPPED",
              skipReason: input.reason,
              completedAt: new Date(),
              completedById: actor.id,
            },
          },
        },
      },
      include: onboardingCaseInclude,
    });

    return toOnboardingCaseDto(updatedCase);
  },

  async uploadDocument(
    caseId: string,
    documentId: string,
    file: { originalname: string; mimetype: string; path: string },
    actor: Actor,
  ) {
    assertCanManage(actor);
    const onboardingCase = await getScopedCase(caseId, actor);
    const document = onboardingCase.documents.find(
      (item) => item.id === documentId,
    );

    if (!document) {
      throw new NotFoundError("Onboarding document not found");
    }

    if (
      onboardingCase.status === "PENDING" ||
      onboardingCase.status === "COMPLETED" ||
      onboardingCase.status === "CANCELLED"
    ) {
      throw new BadRequestError(
        "Documents cannot be uploaded in the current onboarding status",
        "INVALID_ONBOARDING_STATUS",
      );
    }

    if (document.filePath) {
      await fs.unlink(path.resolve(document.filePath)).catch(() => undefined);
    }

    const updatedCase = await prisma.onboardingCase.update({
      where: { id: onboardingCase.id },
      data: {
        documents: {
          update: {
            where: { id: document.id },
            data: {
              status: "RECEIVED",
              fileName: file.originalname,
              filePath: file.path,
              mimeType: file.mimetype,
              uploadedAt: new Date(),
              uploadedById: actor.id,
              verifiedAt: null,
              verifiedById: null,
              waiveReason: null,
            },
          },
        },
      },
      include: onboardingCaseInclude,
    });

    return toOnboardingCaseDto(updatedCase);
  },

  async getDocumentFile(caseId: string, documentId: string, actor: Actor) {
    const onboardingCase = await getScopedCase(caseId, actor);
    const document = onboardingCase.documents.find(
      (item) => item.id === documentId,
    );

    if (!document || !document.filePath || !document.fileName) {
      throw new NotFoundError("Document file not found");
    }

    return {
      filePath: document.filePath,
      fileName: document.fileName,
      mimeType: document.mimeType ?? "application/octet-stream",
    };
  },

  async deleteDocumentFile(caseId: string, documentId: string, actor: Actor) {
    assertCanManage(actor);
    const onboardingCase = await getScopedCase(caseId, actor);
    const document = onboardingCase.documents.find(
      (item) => item.id === documentId,
    );

    if (!document) {
      throw new NotFoundError("Onboarding document not found");
    }

    if (document.filePath) {
      await fs.unlink(path.resolve(document.filePath)).catch(() => undefined);
    }

    const updatedCase = await prisma.onboardingCase.update({
      where: { id: onboardingCase.id },
      data: {
        documents: {
          update: {
            where: { id: document.id },
            data: {
              status: "PENDING",
              fileName: null,
              filePath: null,
              mimeType: null,
              uploadedAt: null,
              uploadedById: null,
              verifiedAt: null,
              verifiedById: null,
              waiveReason: null,
            },
          },
        },
      },
      include: onboardingCaseInclude,
    });

    return toOnboardingCaseDto(updatedCase);
  },

  async verifyDocument(caseId: string, documentId: string, actor: Actor) {
    assertCanManage(actor);
    const onboardingCase = await getScopedCase(caseId, actor);
    const document = onboardingCase.documents.find(
      (item) => item.id === documentId,
    );

    if (!document) {
      throw new NotFoundError("Onboarding document not found");
    }

    if (document.status !== "RECEIVED") {
      throw new BadRequestError(
        "Only received documents can be verified",
        "INVALID_DOCUMENT_STATUS",
      );
    }

    const updatedCase = await prisma.onboardingCase.update({
      where: { id: onboardingCase.id },
      data: {
        documents: {
          update: {
            where: { id: document.id },
            data: {
              status: "VERIFIED",
              verifiedAt: new Date(),
              verifiedById: actor.id,
              waiveReason: null,
            },
          },
        },
      },
      include: onboardingCaseInclude,
    });

    return toOnboardingCaseDto(updatedCase);
  },

  async waiveDocument(
    caseId: string,
    documentId: string,
    input: WaiveOnboardingDocumentInput,
    actor: Actor,
  ) {
    assertCanComplete(actor);
    const onboardingCase = await getScopedCase(caseId, actor);
    const document = onboardingCase.documents.find(
      (item) => item.id === documentId,
    );

    if (!document) {
      throw new NotFoundError("Onboarding document not found");
    }

    if (document.status === "VERIFIED") {
      throw new BadRequestError(
        "Verified documents cannot be waived",
        "INVALID_DOCUMENT_STATUS",
      );
    }

    const updatedCase = await prisma.onboardingCase.update({
      where: { id: onboardingCase.id },
      data: {
        documents: {
          update: {
            where: { id: document.id },
            data: {
              status: "WAIVED",
              verifiedAt: new Date(),
              verifiedById: actor.id,
              waiveReason: input.reason,
            },
          },
        },
      },
      include: onboardingCaseInclude,
    });

    return toOnboardingCaseDto(updatedCase);
  },
};
