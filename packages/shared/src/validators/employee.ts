import { z } from "zod";
import { EMPLOYEE_STATUSES } from "../constants/employee-status.js";

const currencySchema = z.string().trim().length(3).toUpperCase();

export const updateEmployeeSchema = z
  .object({
    fullName: z.string().trim().min(1).max(150).optional(),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1).max(30).optional(),
    workEmail: z.string().trim().email().nullable().optional(),
    jobTitle: z.string().trim().min(1).max(200).optional(),
    expectedJoiningDate: z.string().date().optional(),
    baseSalary: z.coerce.number().int().positive().optional(),
    currency: currencySchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
  departmentId: z.string().uuid().optional(),
  requisitionId: z.string().uuid().optional(),
  search: z.string().trim().max(200).optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type ListEmployeesQueryInput = z.infer<typeof listEmployeesQuerySchema>;
