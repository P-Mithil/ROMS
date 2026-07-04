import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import {
  onboardingController,
  onboardingDocumentsController,
} from "./onboarding.controller.js";
import { ensureOnboardingUploadsDir } from "./ensure-uploads.js";
import { onboardingService } from "./onboarding.service.js";

const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, _file, cb) => {
      try {
        const caseId = getRouteParam(req.params, "id");
        const dir = await ensureOnboardingUploadsDir(caseId);
        cb(null, dir);
      } catch (error) {
        cb(error as Error, "");
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 12);
      cb(null, `${crypto.randomUUID()}${ext}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Unsupported document file type"));
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const onboardingRouter: IRouter = Router();

onboardingRouter.use(authenticate);

onboardingRouter.get(
  "/",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...onboardingController.list,
);
onboardingRouter.get(
  "/:id",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...onboardingController.getById,
);
onboardingRouter.post(
  "/:id/start",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...onboardingController.start,
);
onboardingRouter.post(
  "/:id/confirm-joining",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...onboardingController.confirmJoining,
);
onboardingRouter.post(
  "/:id/complete",
  requireRole("HR_ADMIN"),
  ...onboardingController.complete,
);
onboardingRouter.post(
  "/:id/cancel",
  requireRole("HR_ADMIN"),
  ...onboardingController.cancel,
);
onboardingRouter.patch(
  "/:id/tasks/:taskId",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...onboardingController.updateTask,
);
onboardingRouter.post(
  "/:id/tasks/:taskId/complete",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  ...onboardingController.completeTask,
);
onboardingRouter.post(
  "/:id/tasks/:taskId/skip",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...onboardingController.skipTask,
);
onboardingRouter.post(
  "/:id/documents/:docId/upload",
  requireRole("HR_ADMIN", "RECRUITER"),
  validateUuidParam("id"),
  validateUuidParam("docId"),
  upload.single("document"),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Document file is required" },
        });
        return;
      }

      const data = await onboardingService.uploadDocument(
        getRouteParam(req.params, "id"),
        getRouteParam(req.params, "docId"),
        {
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path,
        },
        req.user!,
      );
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);
onboardingRouter.get(
  "/:id/documents/:docId/download",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  validateUuidParam("id"),
  validateUuidParam("docId"),
  onboardingDocumentsController.download,
);
onboardingRouter.delete(
  "/:id/documents/:docId/file",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...onboardingController.deleteDocumentFile,
);
onboardingRouter.post(
  "/:id/documents/:docId/verify",
  requireRole("HR_ADMIN", "RECRUITER"),
  ...onboardingController.verifyDocument,
);
onboardingRouter.post(
  "/:id/documents/:docId/waive",
  requireRole("HR_ADMIN"),
  ...onboardingController.waiveDocument,
);
