import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { employeesController } from "./employees.controller.js";

export const employeesRouter: IRouter = Router();

employeesRouter.use(authenticate);

employeesRouter.get(
  "/",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...employeesController.list,
);
employeesRouter.get(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...employeesController.getById,
);
employeesRouter.patch(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...employeesController.update,
);
