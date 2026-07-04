import type { NextFunction, Request, Response } from "express";
import {
  cancelOnboardingSchema,
  confirmJoiningSchema,
  listOnboardingQuerySchema,
  skipOnboardingTaskSchema,
  startOnboardingSchema,
  updateOnboardingTaskSchema,
  waiveOnboardingDocumentSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { onboardingService } from "./onboarding.service.js";

export const onboardingController = {
  list: [
    validate({ query: listOnboardingQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await onboardingService.list(req.query as never, req.user!);
        res.status(200).json({
          success: true,
          data: result.items,
          meta: result.meta,
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  getById: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.getById(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  start: [
    validateUuidParam("id"),
    validate({ body: startOnboardingSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.start(
          getRouteParam(req.params, "id"),
          req.body,
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  confirmJoining: [
    validateUuidParam("id"),
    validate({ body: confirmJoiningSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.confirmJoining(
          getRouteParam(req.params, "id"),
          req.body,
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  complete: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.complete(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  cancel: [
    validateUuidParam("id"),
    validate({ body: cancelOnboardingSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.cancel(
          getRouteParam(req.params, "id"),
          req.body,
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  updateTask: [
    validateUuidParam("id"),
    validateUuidParam("taskId"),
    validate({ body: updateOnboardingTaskSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.updateTask(
          getRouteParam(req.params, "id"),
          getRouteParam(req.params, "taskId"),
          req.body,
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  completeTask: [
    validateUuidParam("id"),
    validateUuidParam("taskId"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.completeTask(
          getRouteParam(req.params, "id"),
          getRouteParam(req.params, "taskId"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  skipTask: [
    validateUuidParam("id"),
    validateUuidParam("taskId"),
    validate({ body: skipOnboardingTaskSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.skipTask(
          getRouteParam(req.params, "id"),
          getRouteParam(req.params, "taskId"),
          req.body,
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  verifyDocument: [
    validateUuidParam("id"),
    validateUuidParam("docId"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.verifyDocument(
          getRouteParam(req.params, "id"),
          getRouteParam(req.params, "docId"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  waiveDocument: [
    validateUuidParam("id"),
    validateUuidParam("docId"),
    validate({ body: waiveOnboardingDocumentSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.waiveDocument(
          getRouteParam(req.params, "id"),
          getRouteParam(req.params, "docId"),
          req.body,
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  deleteDocumentFile: [
    validateUuidParam("id"),
    validateUuidParam("docId"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await onboardingService.deleteDocumentFile(
          getRouteParam(req.params, "id"),
          getRouteParam(req.params, "docId"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],
};

export const onboardingDocumentsController = {
  download: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const info = await onboardingService.getDocumentFile(
        getRouteParam(req.params, "id"),
        getRouteParam(req.params, "docId"),
        req.user!,
      );
      res.setHeader("Content-Type", info.mimeType);
      res.download(info.filePath, info.fileName);
    } catch (error) {
      next(error);
    }
  },
};
