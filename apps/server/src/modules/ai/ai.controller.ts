import type { Request, RequestHandler } from "express";
import multer from "multer";
import {
  compareCandidatesSchema,
  draftNoteSchema,
  generateEmailSchema,
  generateJdSchema,
  generateQuestionsSchema,
  insightsFiltersSchema,
  normalizeSkillsSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { BadRequestError } from "../../shared/errors/AppError.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { assertAiConfigured } from "./openai.client.js";
import { aiService } from "./ai.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.mimetype)) {
      cb(new BadRequestError("Only PDF or DOCX resumes are supported"));
      return;
    }
    cb(null, true);
  },
});

function handle(action: (req: Request) => Promise<unknown>): RequestHandler {
  return async (req, res, next) => {
    try {
      assertAiConfigured();
      const data = await action(req);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

export const aiController: Record<string, RequestHandler[]> = {
  parseResumeUpload: [
    upload.single("resume"),
    handle(async (req) => {
      if (!req.file) {
        throw new BadRequestError("Resume file is required", "RESUME_REQUIRED");
      }
      return aiService.parseResumeUpload(req.file, req.user!);
    }),
  ],

  parseCandidateResume: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.parseCandidateResume(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  summarizeResume: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.summarizeResume(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  normalizeSkills: [
    validate({ body: normalizeSkillsSchema }),
    handle(async (req) => aiService.normalizeSkills(req.body, req.user!)),
  ],

  suggestTags: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.suggestTags(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  resumeQuality: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.resumeQuality(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  match: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.match(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  skillGap: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.skillGap(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  compare: [
    validate({ body: compareCandidatesSchema }),
    handle((req) => aiService.compare(req.body, req.user!)),
  ],

  riskAnalysis: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.riskAnalysis(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  generateJd: [
    validate({ body: generateJdSchema }),
    handle((req) => aiService.generateJd(req.body, req.user!)),
  ],

  generateJdForRequisition: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.generateJdForRequisition(
        getRouteParam(req.params, "id"),
        req.user!,
      ),
    ),
  ],

  improveRequisition: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.improveRequisition(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  generateQuestions: [
    validate({ body: generateQuestionsSchema }),
    handle((req) => aiService.generateQuestions(req.body, req.user!)),
  ],

  generateEmail: [
    validate({ body: generateEmailSchema }),
    handle((req) => aiService.generateEmail(req.body, req.user!)),
  ],

  draftNote: [
    validateUuidParam("id"),
    validate({ body: draftNoteSchema }),
    handle((req) =>
      aiService.draftNote(getRouteParam(req.params, "id"), req.body, req.user!),
    ),
  ],

  suggestSalary: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.suggestSalary(getRouteParam(req.params, "id"), req.user!),
    ),
  ],

  feedbackIntelligence: [
    validateUuidParam("id"),
    handle((req) =>
      aiService.feedbackIntelligence(
        getRouteParam(req.params, "id"),
        req.user!,
      ),
    ),
  ],

  hiringInsights: [
    validate({ body: insightsFiltersSchema }),
    handle((req) => aiService.hiringInsights(req.body, req.user!)),
  ],

  departmentInsights: [
    validate({ body: insightsFiltersSchema }),
    handle((req) => aiService.departmentInsights(req.body, req.user!)),
  ],

  missingSkills: [
    validate({ query: insightsFiltersSchema }),
    handle((req) => aiService.missingSkills(req.query as never, req.user!)),
  ],

  weeklySummary: [
    validate({ body: insightsFiltersSchema }),
    handle((req) => aiService.weeklySummary(req.body, req.user!)),
  ],
};
