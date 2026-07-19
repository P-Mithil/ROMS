import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { reportsController } from "./reports.controller.js";

export const reportsRouter: IRouter = Router();

reportsRouter.use(authenticate);
reportsRouter.use(requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"));

reportsRouter.get("/overview", ...reportsController.overview);
reportsRouter.get("/recruitment", ...reportsController.recruitment);
reportsRouter.get("/funnel", ...reportsController.funnel);
reportsRouter.get("/departments", ...reportsController.departments);
reportsRouter.get("/interviews", ...reportsController.interviews);
reportsRouter.get("/offers", ...reportsController.offers);
reportsRouter.get("/onboarding", ...reportsController.onboarding);
reportsRouter.get("/employees", ...reportsController.employees);
reportsRouter.get("/export/:dataset", ...reportsController.export);
