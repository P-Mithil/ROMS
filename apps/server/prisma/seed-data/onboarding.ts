import type {
  EmployeeStatus,
  OnboardingCaseStatus,
  OnboardingDocumentStatus,
  OnboardingDocumentType,
} from "@prisma/client";
import {
  DEFAULT_ONBOARDING_DOCUMENTS,
  DEFAULT_ONBOARDING_TASKS,
} from "@roms/shared";

export { DEFAULT_ONBOARDING_TASKS, DEFAULT_ONBOARDING_DOCUMENTS };

export type OnboardingSeedDefinition = {
  candidateEmail: string;
  requisitionTitle: string;
  caseStatus: OnboardingCaseStatus;
  employeeStatus?: EmployeeStatus;
  employeeCode?: string;
  workEmail?: string;
  startedByEmail?: string;
  joinedByEmail?: string;
  completedByEmail?: string;
  startedDaysFromNow?: number;
  joinedDaysFromNow?: number;
  completedDaysFromNow?: number;
  actualJoiningDaysFromNow?: number;
  completedTaskTitles?: string[];
  skippedTaskTitles?: Array<{ title: string; reason: string }>;
  documentStatuses?: Partial<
    Record<OnboardingDocumentType, OnboardingDocumentStatus>
  >;
};

export const DEMO_ONBOARDING_CASES: OnboardingSeedDefinition[] = [
  {
    candidateEmail: "divya.nair@example.com",
    requisitionTitle: "Sales Development Representative",
    caseStatus: "PENDING",
  },
  {
    candidateEmail: "anita.verma@example.com",
    requisitionTitle: "Sales Development Representative",
    caseStatus: "IN_PROGRESS",
    employeeStatus: "ONBOARDING",
    employeeCode: "EMP-2026-0001",
    startedByEmail: "recruiter@roms.local",
    startedDaysFromNow: -3,
    completedTaskTitles: [
      "Collect signed offer letter",
      "Verify government ID and address proof",
      "Share joining instructions with candidate",
    ],
    documentStatuses: {
      SIGNED_OFFER: "VERIFIED",
      GOVERNMENT_ID: "RECEIVED",
      ADDRESS_PROOF: "RECEIVED",
    },
  },
  {
    candidateEmail: "vikram.singh@example.com",
    requisitionTitle: "HR Coordinator",
    caseStatus: "JOINED",
    employeeStatus: "JOINED",
    employeeCode: "EMP-2026-0002",
    workEmail: "vikram.singh@roms.local",
    startedByEmail: "recruiter@roms.local",
    joinedByEmail: "admin@roms.local",
    startedDaysFromNow: -14,
    joinedDaysFromNow: -2,
    actualJoiningDaysFromNow: -2,
    completedTaskTitles: [
      "Collect signed offer letter",
      "Verify government ID and address proof",
      "Initiate background verification",
      "Create corporate email account",
      "Provision laptop and access credentials",
      "Share joining instructions with candidate",
      "Schedule hiring manager welcome call",
      "Conduct day-1 orientation",
    ],
    documentStatuses: {
      SIGNED_OFFER: "VERIFIED",
      GOVERNMENT_ID: "VERIFIED",
      ADDRESS_PROOF: "VERIFIED",
      TAX_ID_PAN: "VERIFIED",
      BANK_DETAILS: "VERIFIED",
      PHOTO: "VERIFIED",
    },
  },
  {
    candidateEmail: "meera.iyer@example.com",
    requisitionTitle: "HR Coordinator",
    caseStatus: "COMPLETED",
    employeeStatus: "ACTIVE",
    employeeCode: "EMP-2026-0003",
    workEmail: "meera.iyer@roms.local",
    startedByEmail: "recruiter@roms.local",
    joinedByEmail: "admin@roms.local",
    completedByEmail: "admin@roms.local",
    startedDaysFromNow: -30,
    joinedDaysFromNow: -20,
    completedDaysFromNow: -10,
    actualJoiningDaysFromNow: -20,
    completedTaskTitles: DEFAULT_ONBOARDING_TASKS.map((task) => task.title),
    documentStatuses: {
      SIGNED_OFFER: "VERIFIED",
      GOVERNMENT_ID: "VERIFIED",
      ADDRESS_PROOF: "VERIFIED",
      TAX_ID_PAN: "VERIFIED",
      BANK_DETAILS: "VERIFIED",
      PHOTO: "VERIFIED",
      EDUCATION_CERTIFICATE: "WAIVED",
    },
  },
];
