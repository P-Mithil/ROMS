import type { NextFunction, Request, Response } from "express";
import {
  cancelInterviewSchema,
  completeInterviewSchema,
  createInterviewFeedbackSchema,
  createInterviewSchema,
  listInterviewsQuerySchema,
  noShowInterviewSchema,
  updateFeedbackSummarySchema,
  updateInterviewSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { interviewsService } from "./interviews.service.js";

export const interviewsController = {
  list: [
    validate({ query: listInterviewsQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await interviewsService.list(
          req.query as never,
          req.user!,
        );
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
        const data = await interviewsService.getById(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  create: [
    validate({ body: createInterviewSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await interviewsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  update: [
    validateUuidParam("id"),
    validate({ body: updateInterviewSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await interviewsService.update(
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

  delete: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await interviewsService.delete(getRouteParam(req.params, "id"), req.user!);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ],

  cancel: [
    validateUuidParam("id"),
    validate({ body: cancelInterviewSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await interviewsService.cancel(
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
    validate({ body: completeInterviewSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await interviewsService.complete(
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

  markNoShow: [
    validateUuidParam("id"),
    validate({ body: noShowInterviewSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await interviewsService.markNoShow(
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

  createFeedback: [
    validateUuidParam("id"),
    validate({ body: createInterviewFeedbackSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await interviewsService.createFeedback(
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

  updateFeedbackSummary: [
    validateUuidParam("id"),
    validate({ body: updateFeedbackSummarySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await interviewsService.updateFeedbackSummary(
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
};
