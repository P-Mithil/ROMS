import { Prisma } from "@prisma/client";
import fs from "node:fs/promises";
import type {
  AddCandidateNoteInput,
  CreateCandidateInput,
  ListCandidatesQuery,
  RejectCandidateInput,
  UpdateCandidateInput,
} from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import type { AuthenticatedUser } from "../../shared/types/express.js";
import {
  candidateInclude,
  toCandidateDto,
} from "../../shared/utils/candidate-mapper.js";
import { candidatesRepository } from "./candidates.repository.js";

type Actor = AuthenticatedUser;

function buildScope(actor: Actor) {
  if (actor.role === "HR_ADMIN") {
    return {};
  }

  if (actor.role === "RECRUITER") {
    return { requisition: { createdById: actor.id } };
  }

  if (actor.role === "HIRING_MANAGER") {
    return { requisition: { hiringManagerId: actor.id } };
  }

  throw new ForbiddenError("You do not have access to candidates");
}

function assertCanEdit(actor: Actor) {
  if (actor.role === "HR_ADMIN" || actor.role === "RECRUITER") {
    return;
  }

  throw new ForbiddenError("You do not have access to modify candidates");
}

async function getScopedCandidate(id: string, actor: Actor) {
  const candidate = await candidatesRepository.findById(id);
  if (!candidate) {
    throw new NotFoundError("Candidate not found");
  }

  const scope = buildScope(actor);
  const scoped = await prisma.candidate.findFirst({
    where: { id: candidate.id, deletedAt: null, ...scope },
    include: candidateInclude,
  });

  if (!scoped) {
    throw new ForbiddenError("You do not have access to this candidate");
  }

  return scoped;
}

async function validateOpenRequisition(requisitionId: string, actor: Actor) {
  const requisition = await prisma.jobRequisition.findFirst({
    where: {
      id: requisitionId,
      deletedAt: null,
    },
  });

  if (!requisition) {
    throw new BadRequestError("Requisition not found");
  }

  if (requisition.status !== "OPEN") {
    throw new BadRequestError(
      "Candidates can only be added to OPEN requisitions",
      "INVALID_REQUISITION_STATUS",
    );
  }

  // scope check for actor
  if (actor.role === "HR_ADMIN") {
    return requisition;
  }

  if (actor.role === "RECRUITER" && requisition.createdById === actor.id) {
    return requisition;
  }

  throw new ForbiddenError("You do not have access to this requisition");
}

export const candidatesService = {
  async list(query: ListCandidatesQuery, actor: Actor) {
    const scope = buildScope(actor);
    const [items, total] = await candidatesRepository.findMany(query, scope);

    return {
      items: items.map(toCandidateDto),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string, actor: Actor) {
    const candidate = await getScopedCandidate(id, actor);
    return toCandidateDto(candidate);
  },

  async create(input: CreateCandidateInput, actor: Actor) {
    assertCanEdit(actor);
    await validateOpenRequisition(input.requisitionId, actor);

    try {
      const candidate = await candidatesRepository.create({
        requisitionId: input.requisitionId,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        totalExperienceYears:
          input.totalExperienceYears !== undefined
            ? new Prisma.Decimal(input.totalExperienceYears)
            : null,
        skills: input.skills ?? null,
        currentCompany: input.currentCompany ?? null,
        currentLocation: input.currentLocation ?? null,
        noticePeriodDays: input.noticePeriodDays ?? null,
        notes: input.notes ?? null,
        createdById: actor.id,
      });

      return toCandidateDto(candidate);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Candidate with this email already exists for the requisition");
      }
      throw error;
    }
  },

  async update(id: string, input: UpdateCandidateInput, actor: Actor) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);

    try {
      const candidate = await candidatesRepository.update(existing.id, {
        ...input,
        email: input.email ? input.email.toLowerCase() : undefined,
        totalExperienceYears:
          input.totalExperienceYears !== undefined
            ? input.totalExperienceYears === null
              ? null
              : new Prisma.Decimal(input.totalExperienceYears)
            : undefined,
        updatedById: actor.id,
      });

      return toCandidateDto(candidate);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError("Candidate with this email already exists for the requisition");
      }
      throw error;
    }
  },

  async softDelete(id: string, actor: Actor) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);
    await candidatesRepository.update(existing.id, {
      deletedAt: new Date(),
      updatedById: actor.id,
    });
  },

  async updateStatus(
    id: string,
    status: "APPLIED" | "SCREENING" | "SHORTLISTED" | "REJECTED",
    actor: Actor,
  ) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);

    const candidate = await candidatesRepository.update(existing.id, {
      status,
      updatedById: actor.id,
      rejectionReason: status === "REJECTED" ? existing.rejectionReason : null,
      rejectionComments: status === "REJECTED" ? existing.rejectionComments : null,
      rejectedAt: status === "REJECTED" ? existing.rejectedAt : null,
      rejectedById: status === "REJECTED" ? existing.rejectedById : null,
    });

    return toCandidateDto(candidate);
  },

  async getResumeInfo(id: string, actor: Actor) {
    const candidate = await getScopedCandidate(id, actor);
    if (!candidate.resumeFilePath || !candidate.resumeFileName) {
      throw new NotFoundError("Resume not found");
    }
    return {
      id: candidate.id,
      filePath: candidate.resumeFilePath,
      fileName: candidate.resumeFileName,
      mimeType: candidate.resumeMimeType ?? "application/octet-stream",
    };
  },

  async setResume(
    id: string,
    file: { originalname: string; mimetype: string; path: string },
    actor: Actor,
  ) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);
    const previousResumePath = existing.resumeFilePath;

    const candidate = await candidatesRepository.update(existing.id, {
      resumeFileName: file.originalname,
      resumeFilePath: file.path,
      resumeMimeType: file.mimetype,
      resumeUploadedAt: new Date(),
      resumeUploadedById: actor.id,
      updatedById: actor.id,
    });

    if (previousResumePath && previousResumePath !== file.path) {
      await fs.unlink(previousResumePath).catch(() => undefined);
    }

    return toCandidateDto(candidate);
  },

  async clearResume(id: string, actor: Actor) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);

    const candidate = await candidatesRepository.update(existing.id, {
      resumeFileName: null,
      resumeFilePath: null,
      resumeMimeType: null,
      resumeUploadedAt: null,
      resumeUploadedById: null,
      updatedById: actor.id,
    });

    return toCandidateDto(candidate);
  },

  async reject(id: string, input: RejectCandidateInput, actor: Actor) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);

    const candidate = await candidatesRepository.update(existing.id, {
      status: "REJECTED",
      rejectionReason: input.reason,
      rejectionComments: input.comments ?? null,
      rejectedAt: new Date(),
      rejectedById: actor.id,
      updatedById: actor.id,
    });

    return toCandidateDto(candidate);
  },

  async select(id: string, actor: Actor) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);

    if (existing.status !== "SHORTLISTED") {
      throw new BadRequestError(
        "Only shortlisted candidates can be marked as selected",
        "INVALID_CANDIDATE_STATUS",
      );
    }

    const candidate = await candidatesRepository.update(existing.id, {
      status: "SELECTED",
      updatedById: actor.id,
    });

    return toCandidateDto(candidate);
  },

  async addNote(id: string, input: AddCandidateNoteInput, actor: Actor) {
    assertCanEdit(actor);
    const existing = await getScopedCandidate(id, actor);
    await candidatesRepository.createNote(existing.id, actor.id, input.content);
    const refreshed = await getScopedCandidate(existing.id, actor);
    return toCandidateDto(refreshed);
  },
};

