export const EMPLOYEE_STATUSES = [
  "ONBOARDING",
  "JOINED",
  "ACTIVE",
  "WITHDRAWN",
] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];
