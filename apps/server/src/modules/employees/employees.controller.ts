import type { NextFunction, Request, Response } from "express";
import {
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { employeesService } from "./employees.service.js";

export const employeesController = {
  list: [
    validate({ query: listEmployeesQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await employeesService.list(req.query as never, req.user!);
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
        const data = await employeesService.getById(
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
    validate({ body: updateEmployeeSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await employeesService.update(
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
