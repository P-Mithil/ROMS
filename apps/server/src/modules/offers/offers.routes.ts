import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { offersController } from "./offers.controller.js";

export const offersRouter: IRouter = Router();

offersRouter.use(authenticate);

offersRouter.get(
  "/",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...offersController.list,
);
offersRouter.post(
  "/",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.create,
);
offersRouter.get(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...offersController.getById,
);
offersRouter.patch(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.update,
);
offersRouter.delete(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.delete,
);
offersRouter.post(
  "/:id/submit",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.submit,
);
offersRouter.post(
  "/:id/approve",
  requireRole("HR_ADMIN", "HIRING_MANAGER"),
  ...offersController.approve,
);
offersRouter.post(
  "/:id/reject-approval",
  requireRole("HR_ADMIN", "HIRING_MANAGER"),
  ...offersController.rejectApproval,
);
offersRouter.post(
  "/:id/extend",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.extend,
);
offersRouter.post(
  "/:id/withdraw",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.withdraw,
);
offersRouter.post(
  "/:id/record-acceptance",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.recordAcceptance,
);
offersRouter.post(
  "/:id/record-decline",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...offersController.recordDecline,
);
