import type { NextFunction, Request, Response } from "express";
import {
  createOfferSchema,
  listOffersQuerySchema,
  publicDeclineOfferSchema,
  recordOfferAcceptanceSchema,
  recordOfferDeclineSchema,
  rejectOfferApprovalSchema,
  updateOfferSchema,
  withdrawOfferSchema,
} from "@roms/shared";
import { validate, validateUuidParam } from "../../middleware/validate.js";
import { getRouteParam } from "../../shared/utils/route-params.js";
import { offersService } from "./offers.service.js";

export const offersController = {
  list: [
    validate({ query: listOffersQuerySchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await offersService.list(req.query as never, req.user!);
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
        const data = await offersService.getById(
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
    validate({ body: createOfferSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.create(req.body, req.user!);
        res.status(201).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  update: [
    validateUuidParam("id"),
    validate({ body: updateOfferSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.update(
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
        await offersService.delete(getRouteParam(req.params, "id"), req.user!);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ],

  submit: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.submit(
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
        const data = await offersService.approve(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  rejectApproval: [
    validateUuidParam("id"),
    validate({ body: rejectOfferApprovalSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.rejectApproval(
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

  extend: [
    validateUuidParam("id"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.extend(
          getRouteParam(req.params, "id"),
          req.user!,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  withdraw: [
    validateUuidParam("id"),
    validate({ body: withdrawOfferSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.withdraw(
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

  recordAcceptance: [
    validateUuidParam("id"),
    validate({ body: recordOfferAcceptanceSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.recordAcceptance(
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

  recordDecline: [
    validateUuidParam("id"),
    validate({ body: recordOfferDeclineSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.recordDecline(
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

export const publicOffersController = {
  getByToken: [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.getPublicOffer(
          getRouteParam(req.params, "token"),
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  accept: [
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.acceptPublic(
          getRouteParam(req.params, "token"),
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],

  decline: [
    validate({ body: publicDeclineOfferSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = await offersService.declinePublic(
          getRouteParam(req.params, "token"),
          req.body,
        );
        res.status(200).json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  ],
};
