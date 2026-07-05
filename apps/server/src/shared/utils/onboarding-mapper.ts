import type {
  Department,
  Employee,
  OnboardingCase,
  OnboardingDocument,
  OnboardingTask,
  User,
} from "@prisma/client";
import type {
  OnboardingCaseDto,
  OnboardingDocumentDto,
  OnboardingDocumentStatus,
  OnboardingDocumentType,
  OnboardingProgressDto,
  OnboardingTaskDto,
  OnboardingTaskOwner,
  OnboardingTaskPhase,
  OnboardingTaskStatus,
  OnboardingTimelineItemDto,
  OnboardingCaseStatus,
  UserSummary,
} from "@roms/shared";
import { toEmployeeDto } from "./employee-mapper.js";

function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
}

export type OnboardingCaseWithRelations = OnboardingCase & {
  candidate: { id: string; fullName: string; email: string; status: string };
  requisition: { id: string; title: string; status: string };
  offer: {
    id: string;
    jobTitle: string;
    status: string;
    joiningDate: Date;
  };
  employee:
    | (Employee & {
        department: Department;
        hiringManager: User;
        createdBy: User;
        updatedBy: User | null;
      })
    | null;
  startedBy: User | null;
  joinedBy: User | null;
  completedBy: User | null;
  tasks: Array<
    OnboardingTask & {
      completedBy: User | null;
    }
  >;
  documents: Array<
    OnboardingDocument & {
      uploadedBy: User | null;
      verifiedBy: User | null;
    }
  >;
};

function buildProgress(
  tasks: OnboardingTask[],
  documents: OnboardingDocument[],
): OnboardingProgressDto {
  const requiredTasks = tasks.filter((task) => task.isRequired);
  const requiredDocuments = documents.filter((document) => document.isRequired);

  const isTaskDone = (status: OnboardingTask["status"]) =>
    status === "COMPLETED" || status === "SKIPPED";

  const isDocumentReady = (status: OnboardingDocument["status"]) =>
    status === "VERIFIED" || status === "WAIVED";

  return {
    tasksCompleted: tasks.filter((task) => isTaskDone(task.status)).length,
    tasksTotal: tasks.length,
    tasksRequiredCompleted: requiredTasks.filter((task) =>
      isTaskDone(task.status),
    ).length,
    tasksRequiredTotal: requiredTasks.length,
    documentsReady: requiredDocuments.filter((document) =>
      isDocumentReady(document.status),
    ).length,
    documentsRequiredTotal: requiredDocuments.length,
  };
}

function buildTimeline(onboardingCase: OnboardingCaseWithRelations): OnboardingTimelineItemDto[] {
  const items: OnboardingTimelineItemDto[] = [
    {
      key: "created",
      title: "Onboarding case created",
      detail: "Created after offer acceptance",
      at: onboardingCase.createdAt.toISOString(),
    },
  ];

  if (onboardingCase.startedAt) {
    items.push({
      key: "started",
      title: "Onboarding started",
      detail: onboardingCase.startedBy
        ? `Started by ${onboardingCase.startedBy.firstName} ${onboardingCase.startedBy.lastName}`
        : null,
      at: onboardingCase.startedAt.toISOString(),
    });
  }

  if (onboardingCase.joinedAt) {
    items.push({
      key: "joined",
      title: "Joining confirmed",
      detail: onboardingCase.joinedBy
        ? `Confirmed by ${onboardingCase.joinedBy.firstName} ${onboardingCase.joinedBy.lastName}`
        : null,
      at: onboardingCase.joinedAt.toISOString(),
    });
  }

  if (onboardingCase.completedAt) {
    items.push({
      key: "completed",
      title: "Onboarding completed",
      detail: onboardingCase.completedBy
        ? `Completed by ${onboardingCase.completedBy.firstName} ${onboardingCase.completedBy.lastName}`
        : null,
      at: onboardingCase.completedAt.toISOString(),
    });
  }

  if (onboardingCase.cancelledAt) {
    items.push({
      key: "cancelled",
      title: "Onboarding cancelled",
      detail: onboardingCase.cancelReason,
      at: onboardingCase.cancelledAt.toISOString(),
    });
  }

  return items.sort(
    (left, right) => new Date(left.at).getTime() - new Date(right.at).getTime(),
  );
}

export function toOnboardingTaskDto(
  task: OnboardingTask & { completedBy: User | null },
): OnboardingTaskDto {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    phase: task.phase as OnboardingTaskPhase,
    ownerRole: task.ownerRole as OnboardingTaskOwner,
    isRequired: task.isRequired,
    status: task.status as OnboardingTaskStatus,
    dueDate: task.dueDate?.toISOString().slice(0, 10) ?? null,
    sortOrder: task.sortOrder,
    completedAt: task.completedAt?.toISOString() ?? null,
    completedBy: task.completedBy ? toUserSummary(task.completedBy) : null,
    skipReason: task.skipReason,
    notes: task.notes,
  };
}

export function toOnboardingDocumentDto(
  document: OnboardingDocument & {
    uploadedBy: User | null;
    verifiedBy: User | null;
  },
): OnboardingDocumentDto {
  return {
    id: document.id,
    documentType: document.documentType as OnboardingDocumentType,
    isRequired: document.isRequired,
    status: document.status as OnboardingDocumentStatus,
    fileName: document.fileName,
    mimeType: document.mimeType,
    uploadedAt: document.uploadedAt?.toISOString() ?? null,
    uploadedBy: document.uploadedBy ? toUserSummary(document.uploadedBy) : null,
    verifiedAt: document.verifiedAt?.toISOString() ?? null,
    verifiedBy: document.verifiedBy ? toUserSummary(document.verifiedBy) : null,
    waiveReason: document.waiveReason,
    notes: document.notes,
  };
}

export function toOnboardingCaseDto(
  onboardingCase: OnboardingCaseWithRelations,
): OnboardingCaseDto {
  return {
    id: onboardingCase.id,
    status: onboardingCase.status as OnboardingCaseStatus,
    candidate: {
      id: onboardingCase.candidate.id,
      fullName: onboardingCase.candidate.fullName,
      email: onboardingCase.candidate.email,
      status: onboardingCase.candidate.status,
    },
    requisition: {
      id: onboardingCase.requisition.id,
      title: onboardingCase.requisition.title,
      status: onboardingCase.requisition.status,
    },
    offer: {
      id: onboardingCase.offer.id,
      jobTitle: onboardingCase.offer.jobTitle,
      status: onboardingCase.offer.status,
      joiningDate: onboardingCase.offer.joiningDate.toISOString().slice(0, 10),
    },
    employee: onboardingCase.employee
      ? toEmployeeDto(onboardingCase.employee)
      : null,
    tasks: onboardingCase.tasks
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(toOnboardingTaskDto),
    documents: onboardingCase.documents.map(toOnboardingDocumentDto),
    progress: buildProgress(onboardingCase.tasks, onboardingCase.documents),
    timeline: buildTimeline(onboardingCase),
    startedAt: onboardingCase.startedAt?.toISOString() ?? null,
    joinedAt: onboardingCase.joinedAt?.toISOString() ?? null,
    completedAt: onboardingCase.completedAt?.toISOString() ?? null,
    cancelledAt: onboardingCase.cancelledAt?.toISOString() ?? null,
    cancelReason: onboardingCase.cancelReason,
    startedBy: onboardingCase.startedBy
      ? toUserSummary(onboardingCase.startedBy)
      : null,
    joinedBy: onboardingCase.joinedBy
      ? toUserSummary(onboardingCase.joinedBy)
      : null,
    completedBy: onboardingCase.completedBy
      ? toUserSummary(onboardingCase.completedBy)
      : null,
    createdAt: onboardingCase.createdAt.toISOString(),
    updatedAt: onboardingCase.updatedAt.toISOString(),
  };
}

export const onboardingCaseInclude = {
  candidate: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true,
    },
  },
  requisition: {
    select: {
      id: true,
      title: true,
      status: true,
      createdById: true,
      hiringManagerId: true,
    },
  },
  offer: {
    select: {
      id: true,
      jobTitle: true,
      status: true,
      joiningDate: true,
    },
  },
  employee: {
    include: {
      department: true,
      hiringManager: true,
      createdBy: true,
      updatedBy: true,
    },
  },
  startedBy: true,
  joinedBy: true,
  completedBy: true,
  tasks: {
    include: {
      completedBy: true,
    },
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  documents: {
    include: {
      uploadedBy: true,
      verifiedBy: true,
    },
  },
} as const;
