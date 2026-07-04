import type { Candidate, CandidateNote, JobRequisition, User } from "@prisma/client";
import type { CandidateDto, CandidateStatus, UserSummary } from "@roms/shared";

type CandidateWithRelations = Candidate & {
  requisition: JobRequisition;
  createdBy: User;
  updatedBy: User | null;
  rejectedBy: User | null;
  resumeUploadedBy: User | null;
  recruiterNotes: Array<CandidateNote & { createdBy: User }>;
};

function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export function toCandidateDto(candidate: CandidateWithRelations): CandidateDto {
  return {
    id: candidate.id,
    requisition: {
      id: candidate.requisition.id,
      title: candidate.requisition.title,
      status: candidate.requisition.status,
    },
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone,
    totalExperienceYears: candidate.totalExperienceYears
      ? String(candidate.totalExperienceYears)
      : null,
    skills: candidate.skills,
    currentCompany: candidate.currentCompany,
    currentLocation: candidate.currentLocation,
    noticePeriodDays: candidate.noticePeriodDays,
    resume:
      candidate.resumeFilePath && candidate.resumeFileName && candidate.resumeMimeType
        ? {
            fileName: candidate.resumeFileName,
            mimeType: candidate.resumeMimeType,
            uploadedAt: candidate.resumeUploadedAt?.toISOString() ?? null,
            uploadedBy: candidate.resumeUploadedBy
              ? toUserSummary(candidate.resumeUploadedBy)
              : null,
          }
        : null,
    status: candidate.status as CandidateStatus,
    notes: candidate.notes,
    rejectionReason: candidate.rejectionReason,
    rejectionComments: candidate.rejectionComments,
    rejectedAt: candidate.rejectedAt?.toISOString() ?? null,
    rejectedBy: candidate.rejectedBy ? toUserSummary(candidate.rejectedBy) : null,
    recruiterNotes: candidate.recruiterNotes.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt.toISOString(),
      createdBy: toUserSummary(note.createdBy),
    })),
    createdBy: toUserSummary(candidate.createdBy),
    updatedBy: candidate.updatedBy ? toUserSummary(candidate.updatedBy) : null,
    createdAt: candidate.createdAt.toISOString(),
    updatedAt: candidate.updatedAt.toISOString(),
  };
}

export const candidateInclude = {
  requisition: true,
  createdBy: true,
  updatedBy: true,
  rejectedBy: true,
  resumeUploadedBy: true,
  recruiterNotes: {
    include: {
      createdBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  },
} as const;

