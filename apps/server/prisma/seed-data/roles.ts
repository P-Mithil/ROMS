import type { RoleName } from "@prisma/client";

export type RoleDefinition = {
  name: RoleName;
  description: string;
};

export const ROLES: RoleDefinition[] = [
  {
    name: "HR_ADMIN",
    description: "Full system access including user and department management",
  },
  {
    name: "RECRUITER",
    description: "Manages requisitions, candidates, interviews, and offers",
  },
  {
    name: "HIRING_MANAGER",
    description: "Approves requisitions and offers for their department",
  },
  {
    name: "INTERVIEWER",
    description: "Conducts interviews and submits feedback",
  },
];
