import type { Request, Response, NextFunction } from "express";
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { usersService } from "./users.service.js";

export const usersController = {
  list: [
    validate({ query: listUsersQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await usersService.list(req.query as never);
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
        const data = await usersService.getById(getRouteParam(req.params, "id"));
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  create: [
    validate({ body: createUserSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await usersService.create(req.body);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  update: [
    validateUuidParam("id"),
    validate({ body: updateUserSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await usersService.update(getRouteParam(req.params, "id"), req.body);
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
        const data = await usersService.deactivate(getRouteParam(req.params, "id"));
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  activate: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await usersService.activate(getRouteParam(req.params, "id"));
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  listInterviewers: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await usersService.listInterviewers();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  listHiringManagers: async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const data = await usersService.listHiringManagers();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
