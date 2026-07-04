import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { interviewsController } from "./interviews.controller.js";

export const interviewsRouter: IRouter = Router();

interviewsRouter.use(authenticate);

interviewsRouter.get(
  "/",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER"),
  ...interviewsController.list,
);
interviewsRouter.post(
  "/",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...interviewsController.create,
);
interviewsRouter.get(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER"),
  ...interviewsController.getById,
);
interviewsRouter.patch(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...interviewsController.update,
);
interviewsRouter.delete(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...interviewsController.delete,
);
interviewsRouter.post(
  "/:id/cancel",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...interviewsController.cancel,
);
interviewsRouter.post(
  "/:id/complete",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...interviewsController.complete,
);
interviewsRouter.post(
  "/:id/mark-no-show",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...interviewsController.markNoShow,
);
interviewsRouter.post(
  "/:id/feedback",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER", "INTERVIEWER"),
  ...interviewsController.createFeedback,
);
interviewsRouter.patch(
  "/:id/feedback-summary",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...interviewsController.updateFeedbackSummary,
);
