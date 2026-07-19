import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { aiController } from "./ai.controller.js";

export const aiRouter: IRouter = Router();

aiRouter.use(authenticate);
aiRouter.use(requireRole("HR_ADMIN", "RECRUITER"));

aiRouter.post("/parse-resume", ...aiController.parseResumeUpload);
aiRouter.post(
  "/candidates/:id/parse-resume",
  ...aiController.parseCandidateResume,
);
aiRouter.post(
  "/candidates/:id/summarize-resume",
  ...aiController.summarizeResume,
);
aiRouter.post("/normalize-skills", ...aiController.normalizeSkills);
aiRouter.post("/candidates/compare", ...aiController.compare);
aiRouter.post("/candidates/:id/suggest-tags", ...aiController.suggestTags);
aiRouter.post("/candidates/:id/resume-quality", ...aiController.resumeQuality);
aiRouter.post("/candidates/:id/match", ...aiController.match);
aiRouter.post("/candidates/:id/skill-gap", ...aiController.skillGap);
aiRouter.post("/candidates/:id/risk-analysis", ...aiController.riskAnalysis);
aiRouter.post("/requisitions/generate-jd", ...aiController.generateJd);
aiRouter.post(
  "/requisitions/:id/generate-jd",
  ...aiController.generateJdForRequisition,
);
aiRouter.post(
  "/requisitions/:id/improve",
  ...aiController.improveRequisition,
);
aiRouter.post(
  "/interviews/generate-questions",
  ...aiController.generateQuestions,
);
aiRouter.post("/emails/generate", ...aiController.generateEmail);
aiRouter.post("/candidates/:id/draft-note", ...aiController.draftNote);
aiRouter.post("/candidates/:id/suggest-salary", ...aiController.suggestSalary);
aiRouter.post(
  "/interviews/:id/feedback-summary",
  ...aiController.feedbackIntelligence,
);
aiRouter.post("/insights/hiring", ...aiController.hiringInsights);
aiRouter.post("/insights/departments", ...aiController.departmentInsights);
aiRouter.get("/insights/missing-skills", ...aiController.missingSkills);
aiRouter.post("/insights/weekly-summary", ...aiController.weeklySummary);
