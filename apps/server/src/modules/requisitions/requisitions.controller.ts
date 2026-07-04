import type { Request, Response, NextFunction } from "express";
import {
  closeRequisitionSchema,
  createRequisitionSchema,
  listRequisitionsQuerySchema,
  rejectRequisitionSchema,
  updateRequisitionSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { requisitionsService } from "./requisitions.service.js";

export const requisitionsController = {
  list: [
    validate({ query: listRequisitionsQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await requisitionsService.list(
          req.query as never,
          req.user!,
        );
        res.status(200).json({
          success: true,
          data: result.items,
          meta: result.meta,
          summary: result.summary,
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  create: [
    validate({ body: createRequisitionSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await requisitionsService.create(req.body, req.user!);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  getById: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await requisitionsService.getById(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  update: [
    validateUuidParam("id"),
    validate({ body: updateRequisitionSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await requisitionsService.update(
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

  submit: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await requisitionsService.submit(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  approve: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await requisitionsService.approve(
          getRouteParam(req.params, "id"),
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
    validate({ body: rejectRequisitionSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await requisitionsService.reject(
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

  close: [
    validateUuidParam("id"),
    validate({ body: closeRequisitionSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await requisitionsService.close(
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
        await requisitionsService.delete(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ],
};
