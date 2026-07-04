import type { Request, Response, NextFunction } from "express";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { departmentsService } from "./departments.service.js";

export const departmentsController = {
  list: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await departmentsService.list();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  getById: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await departmentsService.getById(getRouteParam(req.params, "id"));
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  create: [
    validate({ body: createDepartmentSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await departmentsService.create(req.body);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  update: [
    validateUuidParam("id"),
    validate({ body: updateDepartmentSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await departmentsService.update(getRouteParam(req.params, "id"), req.body);
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  deactivate: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await departmentsService.deactivate(getRouteParam(req.params, "id"));
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],
};
