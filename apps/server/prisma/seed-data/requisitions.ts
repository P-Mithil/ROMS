import type { RequisitionStatus } from "@prisma/client";

export type RequisitionSeedDefinition = {
  title: string;
  description: string;
  status: RequisitionStatus;
  departmentName: string;
  hiringManagerEmail: string;
  createdByEmail: string;
  rejectionReason?: string;
  closeReason?: string;
};

export const DEMO_REQUISITIONS: RequisitionSeedDefinition[] = [
  {
    title: "Senior Software Engineer",
    description: "Build backend APIs and work with PostgreSQL and Prisma.",
    status: "DRAFT",
    departmentName: "Engineering",
    hiringManagerEmail: "hm@roms.local",
    createdByEmail: "recruiter@roms.local",
  },
  {
    title: "HR Coordinator",
    description: "Support recruitment and onboarding activities.",
    status: "PENDING_APPROVAL",
    departmentName: "Human Resources",
    hiringManagerEmail: "hm@roms.local",
    createdByEmail: "recruiter@roms.local",
  },
  {
    title: "Sales Development Representative",
    description: "Generate leads and support the sales team.",
    status: "OPEN",
    departmentName: "Sales",
    hiringManagerEmail: "hm@roms.local",
    createdByEmail: "recruiter@roms.local",
  },
];
