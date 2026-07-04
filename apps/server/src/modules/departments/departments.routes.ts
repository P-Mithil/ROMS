import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { departmentsController } from "./departments.controller.js";

export const departmentsRouter: IRouter = Router();

departmentsRouter.use(authenticate);

// Any logged-in user can view departments
departmentsRouter.get("/", departmentsController.list);
departmentsRouter.get("/:id", ...departmentsController.getById);

// Only HR Admin can create or edit departments
departmentsRouter.post(
  "/",
  requireRole("HR_ADMIN"),
  ...departmentsController.create,
);
departmentsRouter.patch(
  "/:id",
  requireRole("HR_ADMIN"),
  ...departmentsController.update,
);
departmentsRouter.patch(
  "/:id/deactivate",
  requireRole("HR_ADMIN"),
  ...departmentsController.deactivate,
);
