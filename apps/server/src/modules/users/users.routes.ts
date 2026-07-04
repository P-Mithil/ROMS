import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { usersController } from "./users.controller.js";

export const usersRouter: IRouter = Router();

usersRouter.use(authenticate);

usersRouter.get("/interviewers", usersController.listInterviewers);
usersRouter.get(
  "/hiring-managers",
  requireRole("HR_ADMIN", "RECRUITER"),
  usersController.listHiringManagers,
);

usersRouter.get("/", requireRole("HR_ADMIN"), ...usersController.list);
usersRouter.post("/", requireRole("HR_ADMIN"), ...usersController.create);
usersRouter.get("/:id", requireRole("HR_ADMIN"), ...usersController.getById);
usersRouter.patch("/:id", requireRole("HR_ADMIN"), ...usersController.update);
usersRouter.patch(
  "/:id/deactivate",
  requireRole("HR_ADMIN"),
  ...usersController.deactivate,
);
usersRouter.patch(
  "/:id/activate",
  requireRole("HR_ADMIN"),
  ...usersController.activate,
);
