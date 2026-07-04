import type {
  EmploymentType,
  OfferStatus,
  WorkMode,
} from "@prisma/client";

export const DEMO_OFFER_RESPONSE_TOKEN = "demo-offer-token-sneha";

export type OfferSeedDefinition = {
  candidateEmail: string;
  requisitionTitle: string;
  status: OfferStatus;
  jobTitle: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  baseSalary: number;
  currency?: string;
  joiningDaysFromNow: number;
  validUntilDaysFromNow: number;
  terms?: string;
  internalNotes?: string;
  submittedDaysFromNow?: number;
  approvedByEmail?: string;
  approvedDaysFromNow?: number;
  approvalRejectionReason?: string;
  extendedByEmail?: string;
  extendedDaysFromNow?: number;
  respondedDaysFromNow?: number;
  declineReason?: string;
  responseNotes?: string;
  createdByEmail: string;
  responseToken?: typeof DEMO_OFFER_RESPONSE_TOKEN;
};

export const DEMO_OFFERS: OfferSeedDefinition[] = [
  {
    candidateEmail: "karan.patel@example.com",
    requisitionTitle: "Sales Development Representative",
    status: "DRAFT",
    jobTitle: "Sales Development Representative",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    baseSalary: 650000,
    joiningDaysFromNow: 45,
    validUntilDaysFromNow: 14,
    terms:
      "Annual CTC inclusive of fixed pay. Standard company benefits apply after joining.",
    internalNotes: "Align with hiring manager before submission.",
    createdByEmail: "recruiter@roms.local",
  },
  {
    candidateEmail: "arjun.mehta@example.com",
    requisitionTitle: "HR Coordinator",
    status: "PENDING_APPROVAL",
    jobTitle: "HR Coordinator",
    employmentType: "FULL_TIME",
    workMode: "OFFICE",
    baseSalary: 550000,
    joiningDaysFromNow: 30,
    validUntilDaysFromNow: 10,
    terms: "Fixed annual compensation with standard HR team benefits.",
    submittedDaysFromNow: -1,
    createdByEmail: "recruiter@roms.local",
  },
  {
    candidateEmail: "sneha.reddy@example.com",
    requisitionTitle: "Sales Development Representative",
    status: "EXTENDED",
    jobTitle: "Sales Development Representative",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    baseSalary: 720000,
    joiningDaysFromNow: 30,
    validUntilDaysFromNow: 7,
    terms:
      "Congratulations on your offer. Please review compensation, joining date, and role details before responding.",
    submittedDaysFromNow: -4,
    approvedByEmail: "hm@roms.local",
    approvedDaysFromNow: -3,
    extendedByEmail: "recruiter@roms.local",
    extendedDaysFromNow: -2,
    createdByEmail: "recruiter@roms.local",
    responseToken: DEMO_OFFER_RESPONSE_TOKEN,
  },
  {
    candidateEmail: "divya.nair@example.com",
    requisitionTitle: "Sales Development Representative",
    status: "ACCEPTED",
    jobTitle: "Sales Development Representative",
    employmentType: "FULL_TIME",
    workMode: "REMOTE",
    baseSalary: 700000,
    joiningDaysFromNow: 21,
    validUntilDaysFromNow: -3,
    terms: "Accepted offer for remote SDR role.",
    submittedDaysFromNow: -10,
    approvedByEmail: "hm@roms.local",
    approvedDaysFromNow: -9,
    extendedByEmail: "recruiter@roms.local",
    extendedDaysFromNow: -8,
    respondedDaysFromNow: -7,
    responseNotes: "Candidate accepted via email confirmation.",
    createdByEmail: "recruiter@roms.local",
  },
  {
    candidateEmail: "anita.verma@example.com",
    requisitionTitle: "Sales Development Representative",
    status: "ACCEPTED",
    jobTitle: "Sales Development Representative",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    baseSalary: 710000,
    joiningDaysFromNow: 25,
    validUntilDaysFromNow: -2,
    terms: "Accepted offer for hybrid SDR role.",
    submittedDaysFromNow: -8,
    approvedByEmail: "hm@roms.local",
    approvedDaysFromNow: -7,
    extendedByEmail: "recruiter@roms.local",
    extendedDaysFromNow: -6,
    respondedDaysFromNow: -5,
    responseNotes: "Candidate accepted via secure offer link.",
    createdByEmail: "recruiter@roms.local",
  },
  {
    candidateEmail: "vikram.singh@example.com",
    requisitionTitle: "HR Coordinator",
    status: "ACCEPTED",
    jobTitle: "HR Coordinator",
    employmentType: "FULL_TIME",
    workMode: "OFFICE",
    baseSalary: 580000,
    joiningDaysFromNow: -2,
    validUntilDaysFromNow: -15,
    terms: "Accepted offer for HR Coordinator role.",
    submittedDaysFromNow: -20,
    approvedByEmail: "hm@roms.local",
    approvedDaysFromNow: -19,
    extendedByEmail: "recruiter@roms.local",
    extendedDaysFromNow: -18,
    respondedDaysFromNow: -17,
    createdByEmail: "recruiter@roms.local",
  },
  {
    candidateEmail: "meera.iyer@example.com",
    requisitionTitle: "HR Coordinator",
    status: "ACCEPTED",
    jobTitle: "HR Coordinator",
    employmentType: "FULL_TIME",
    workMode: "OFFICE",
    baseSalary: 600000,
    joiningDaysFromNow: -20,
    validUntilDaysFromNow: -30,
    terms: "Accepted offer for HR Coordinator role.",
    submittedDaysFromNow: -35,
    approvedByEmail: "hm@roms.local",
    approvedDaysFromNow: -34,
    extendedByEmail: "recruiter@roms.local",
    extendedDaysFromNow: -33,
    respondedDaysFromNow: -32,
    responseNotes: "Candidate accepted and onboarding completed.",
    createdByEmail: "recruiter@roms.local",
  },
  {
    candidateEmail: "rohit.shah@example.com",
    requisitionTitle: "Sales Development Representative",
    status: "DECLINED",
    jobTitle: "Sales Development Representative",
    employmentType: "FULL_TIME",
    workMode: "HYBRID",
    baseSalary: 680000,
    joiningDaysFromNow: 35,
    validUntilDaysFromNow: -1,
    terms: "Offer for hybrid SDR role.",
    submittedDaysFromNow: -12,
    approvedByEmail: "hm@roms.local",
    approvedDaysFromNow: -11,
    extendedByEmail: "recruiter@roms.local",
    extendedDaysFromNow: -10,
    respondedDaysFromNow: -9,
    declineReason: "Accepted another offer with a higher base salary.",
    createdByEmail: "recruiter@roms.local",
  },
];
