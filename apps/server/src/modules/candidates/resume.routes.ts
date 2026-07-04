import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { authenticate } from "../../middleware/authenticate.js";
import { requireRole } from "../../middleware/require-role.js";
import { validateUuidParam } from "../../middleware/validate.js";
import { candidatesService } from "./candidates.service.js";
import { ensureResumeUploadsDir } from "./ensure-uploads.js";
import { resumeController } from "./resume.controller.js";

const uploadsDir = await ensureResumeUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 12);
    const name = `${crypto.randomUUID()}${ext}`;
    cb(null, name);
  },
});

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) {
  const allowed = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (!allowed.includes(file.mimetype)) {
    cb(new Error("Unsupported resume file type"));
    return;
  }

  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const resumeRouter: IRouter = Router();

resumeRouter.use(authenticate);

resumeRouter.post(
  "/:id/resume",
  requireRole("HR_ADMIN", "RECRUITER"),
  validateUuidParam("id"),
  upload.single("resume"),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Resume file is required" },
        });
        return;
      }

      const data = await candidatesService.setResume(
        Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
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

resumeRouter.get(
  "/:id/resume",
  requireRole("HR_ADMIN", "RECRUITER", "HIRING_MANAGER"),
  validateUuidParam("id"),
  resumeController.download,
);

resumeRouter.delete(
  "/:id/resume",
  requireRole("HR_ADMIN", "RECRUITER"),
  validateUuidParam("id"),
  resumeController.delete,
);

