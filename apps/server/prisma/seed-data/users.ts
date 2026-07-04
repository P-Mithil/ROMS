import type { RoleName } from "@prisma/client";

export const DEMO_PASSWORD = "RomsDev123!";

export type DemoUserDefinition = {
  email: string;
  firstName: string;
  lastName: string;
  role: RoleName;
  departmentName: string | null;
};

export const DEMO_USERS: DemoUserDefinition[] = [
  {
    email: "admin@roms.local",
    firstName: "Alex",
    lastName: "Admin",
    role: "HR_ADMIN",
    departmentName: "Human Resources",
  },
  {
    email: "recruiter@roms.local",
    firstName: "Riley",
    lastName: "Recruiter",
    role: "RECRUITER",
    departmentName: "Human Resources",
  },
  {
    email: "hm@roms.local",
    firstName: "Morgan",
    lastName: "Manager",
    role: "HIRING_MANAGER",
    departmentName: "Engineering",
  },
  {
    email: "interviewer@roms.local",
    firstName: "Jordan",
    lastName: "Interviewer",
    role: "INTERVIEWER",
    departmentName: "Engineering",
  },
];
