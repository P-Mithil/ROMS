import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { candidatesController } from "./candidates.controller.js";
import { resumeRouter } from "./resume.routes.js";

export const candidatesRouter: IRouter = Router();

candidatesRouter.use(authenticate);

candidatesRouter.get(
  "/",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...candidatesController.list,
);
candidatesRouter.post(
  "/",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.create,
);
candidatesRouter.get(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...candidatesController.getById,
);
candidatesRouter.patch(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.update,
);
candidatesRouter.delete(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.softDelete,
);

candidatesRouter.post(
  "/:id/move-to-screening",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.moveToScreening,
);
candidatesRouter.post(
  "/:id/shortlist",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.shortlist,
);
candidatesRouter.post(
  "/:id/reject",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.reject,
);
candidatesRouter.post(
  "/:id/select",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.select,
);
candidatesRouter.post(
  "/:id/notes",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...candidatesController.addNote,
);

// Resume routes mounted here to share auth scope + candidate scoping checks
candidatesRouter.use(resumeRouter);

