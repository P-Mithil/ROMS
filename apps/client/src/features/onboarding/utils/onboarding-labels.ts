import type {
  EmployeeStatus,
  OnboardingCaseStatus,
  OnboardingDocumentStatus,
  OnboardingDocumentType,
  OnboardingTaskOwner,
  OnboardingTaskStatus,
} from "@roms/shared";

export const ONBOARDING_CASE_STATUS_LABELS: Record<OnboardingCaseStatus, string> =
  {
    PENDING: "Pending",
    IN_PROGRESS: "In progress",
    JOINED: "Joined",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  ONBOARDING: "Onboarding",
  JOINED: "Joined",
  ACTIVE: "Active",
  WITHDRAWN: "Withdrawn",
};

export const ONBOARDING_TASK_STATUS_LABELS: Record<OnboardingTaskStatus, string> =
  {
    PENDING: "Pending",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    SKIPPED: "Skipped",
  };

export const ONBOARDING_DOCUMENT_STATUS_LABELS: Record<
  OnboardingDocumentStatus,
  string
> = {
  PENDING: "Pending",
  RECEIVED: "Received",
  VERIFIED: "Verified",
  WAIVED: "Waived",
};

export const ONBOARDING_DOCUMENT_TYPE_LABELS: Record<
  OnboardingDocumentType,
  string
> = {
  SIGNED_OFFER: "Signed offer letter",
  GOVERNMENT_ID: "Government ID",
  ADDRESS_PROOF: "Address proof",
  EDUCATION_CERTIFICATE: "Education certificate",
  PREVIOUS_EMPLOYMENT_PROOF: "Previous employment proof",
  TAX_ID_PAN: "Tax ID (PAN)",
  BANK_DETAILS: "Bank details",
  PHOTO: "Photo",
  OTHER: "Other",
};

export const ONBOARDING_TASK_OWNER_LABELS: Record<OnboardingTaskOwner, string> =
  {
    HR: "HR",
    IT: "IT",
    HIRING_MANAGER: "Hiring manager",
  };

export function formatOnboardingCaseStatus(status: OnboardingCaseStatus) {
  return ONBOARDING_CASE_STATUS_LABELS[status];
}

export function formatEmployeeStatus(status: EmployeeStatus) {
  return EMPLOYEE_STATUS_LABELS[status];
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calcOverallProgress(progress: {
  tasksRequiredCompleted: number;
  tasksRequiredTotal: number;
  documentsReady: number;
  documentsRequiredTotal: number;
}) {
  const total =
    progress.tasksRequiredTotal + progress.documentsRequiredTotal;
  if (total === 0) {
    return 0;
  }

  const done =
    progress.tasksRequiredCompleted + progress.documentsReady;
  return Math.round((done / total) * 100);
}
