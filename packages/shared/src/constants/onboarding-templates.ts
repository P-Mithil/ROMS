import type { OnboardingDocumentType } from "./onboarding-document-type.js";
import type { OnboardingTaskOwner } from "./onboarding-task-owner.js";
import type { OnboardingTaskPhase } from "./onboarding-task-phase.js";

export type OnboardingTaskTemplate = {
  title: string;
  description?: string;
  phase: OnboardingTaskPhase;
  ownerRole: OnboardingTaskOwner;
  isRequired?: boolean;
  sortOrder: number;
};

export type OnboardingDocumentTemplate = {
  documentType: OnboardingDocumentType;
  isRequired?: boolean;
};

export const DEFAULT_ONBOARDING_TASKS: OnboardingTaskTemplate[] = [
  {
    title: "Collect signed offer letter",
    description: "Obtain the candidate's signed copy of the offer letter.",
    phase: "PRE_JOINING",
    ownerRole: "HR",
    sortOrder: 1,
  },
  {
    title: "Verify government ID and address proof",
    phase: "PRE_JOINING",
    ownerRole: "HR",
    sortOrder: 2,
  },
  {
    title: "Initiate background verification",
    phase: "PRE_JOINING",
    ownerRole: "HR",
    sortOrder: 3,
  },
  {
    title: "Create corporate email account",
    phase: "PRE_JOINING",
    ownerRole: "IT",
    sortOrder: 4,
  },
  {
    title: "Provision laptop and access credentials",
    phase: "PRE_JOINING",
    ownerRole: "IT",
    sortOrder: 5,
  },
  {
    title: "Share joining instructions with candidate",
    phase: "PRE_JOINING",
    ownerRole: "HR",
    sortOrder: 6,
  },
  {
    title: "Schedule hiring manager welcome call",
    phase: "PRE_JOINING",
    ownerRole: "HIRING_MANAGER",
    sortOrder: 7,
  },
  {
    title: "Conduct day-1 orientation",
    phase: "POST_JOINING",
    ownerRole: "HR",
    sortOrder: 8,
  },
  {
    title: "Team introduction and buddy assignment",
    phase: "POST_JOINING",
    ownerRole: "HIRING_MANAGER",
    sortOrder: 9,
  },
  {
    title: "Complete policy acknowledgment",
    phase: "POST_JOINING",
    ownerRole: "HR",
    sortOrder: 10,
  },
  {
    title: "Confirm badge and building access issued",
    phase: "POST_JOINING",
    ownerRole: "IT",
    sortOrder: 11,
  },
];

export const DEFAULT_ONBOARDING_DOCUMENTS: OnboardingDocumentTemplate[] = [
  { documentType: "SIGNED_OFFER", isRequired: true },
  { documentType: "GOVERNMENT_ID", isRequired: true },
  { documentType: "ADDRESS_PROOF", isRequired: true },
  { documentType: "TAX_ID_PAN", isRequired: true },
  { documentType: "BANK_DETAILS", isRequired: true },
  { documentType: "PHOTO", isRequired: true },
  { documentType: "EDUCATION_CERTIFICATE", isRequired: false },
  { documentType: "PREVIOUS_EMPLOYMENT_PROOF", isRequired: false },
];
