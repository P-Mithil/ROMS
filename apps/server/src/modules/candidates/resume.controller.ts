import type { Request, Response, NextFunction } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import { candidatesService } from "./candidates.service.js";

export const resumeController = {
  download: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const info = await candidatesService.getResumeInfo(id!, req.user!);
      const absolute = path.resolve(info.filePath);
      res.setHeader("Content-Type", info.mimeType);
      res.download(absolute, info.fileName);
    } catch (error) {
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const info = await candidatesService.getResumeInfo(id!, req.user!);
      const absolute = path.resolve(info.filePath);
      await candidatesService.clearResume(id!, req.user!);
      await fs.unlink(absolute).catch(() => undefined);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

