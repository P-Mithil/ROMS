import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { requisitionsController } from "./requisitions.controller.js";

export const requisitionsRouter: IRouter = Router();

requisitionsRouter.use(authenticate);

const canAccessRequisitions = requireRole(
  "HR_ADMIN",
  "RECRUITER",
  "HIRING_MANAGER",
);

requisitionsRouter.get("/", canAccessRequisitions, ...requisitionsController.list);
requisitionsRouter.post(
  "/",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...requisitionsController.create,
);
requisitionsRouter.get(
  "/:id",
  canAccessRequisitions,
  ...requisitionsController.getById,
);
requisitionsRouter.patch(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...requisitionsController.update,
);
requisitionsRouter.delete(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...requisitionsController.delete,
);
requisitionsRouter.post(
  "/:id/submit",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...requisitionsController.submit,
);
requisitionsRouter.post(
  "/:id/approve",
  requireRole("HR_ADMIN", "HIRING_MANAGER"),
  ...requisitionsController.approve,
);
requisitionsRouter.post(
  "/:id/reject",
  requireRole("HR_ADMIN", "HIRING_MANAGER"),
  ...requisitionsController.reject,
);
requisitionsRouter.post(
  "/:id/close",
  canAccessRequisitions,
  ...requisitionsController.close,
);
