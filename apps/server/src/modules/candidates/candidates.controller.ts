import type { Request, Response, NextFunction } from "express";
import {
  addCandidateNoteSchema,
  createCandidateSchema,
  listCandidatesQuerySchema,
  rejectCandidateSchema,
  updateCandidateSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { candidatesService } from "./candidates.service.js";

export const candidatesController = {
  list: [
    validate({ query: listCandidatesQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await candidatesService.list(req.query as never, req.user!);
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
        const data = await candidatesService.getById(
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
    validate({ body: createCandidateSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await candidatesService.create(req.body, req.user!);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  update: [
    validateUuidParam("id"),
    validate({ body: updateCandidateSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await candidatesService.update(
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

  softDelete: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await candidatesService.softDelete(getRouteParam(req.params, "id"), req.user!);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ],

  moveToScreening: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await candidatesService.updateStatus(
          getRouteParam(req.params, "id"),
          "SCREENING",
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  shortlist: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await candidatesService.updateStatus(
          getRouteParam(req.params, "id"),
          "SHORTLISTED",
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  reject: [
    validateUuidParam("id"),
    validate({ body: rejectCandidateSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await candidatesService.reject(
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

  select: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await candidatesService.select(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  addNote: [
    validateUuidParam("id"),
    validate({ body: addCandidateNoteSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await candidatesService.addNote(
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

