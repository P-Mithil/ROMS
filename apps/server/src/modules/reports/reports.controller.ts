import type { NextFunction, Request, Response } from "express";
import {
  reportExportParamsSchema,
  reportExportQuerySchema,
  reportFiltersSchema,
} from "@roms/shared";
import { validate } from "../../middleware/validate.js";
import { reportsService } from "./reports.service.js";

function handle(
  action: (req: Request) => Promise<unknown>,
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await action(req);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

export const reportsController = {
  overview: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.overview(req.query as never, req.user!)),
  ],
  recruitment: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.recruitment(req.query as never, req.user!)),
  ],
  funnel: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.funnel(req.query as never, req.user!)),
  ],
  departments: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.departments(req.query as never, req.user!)),
  ],
  interviews: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.interviews(req.query as never, req.user!)),
  ],
  offers: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.offers(req.query as never, req.user!)),
  ],
  onboarding: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.onboarding(req.query as never, req.user!)),
  ],
  employees: [
    validate({ query: reportFiltersSchema }),
    handle((req) => reportsService.employees(req.query as never, req.user!)),
  ],
  export: [
    validate({
      params: reportExportParamsSchema,
      query: reportExportQuerySchema,
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dataset = (req.params as { dataset: string }).dataset as never;
        const query = req.query as {
          format: "csv" | "xlsx";
        } & Record<string, unknown>;
        const result = await reportsService.export(
          dataset,
          query.format,
          query as never,
          req.user!,
        );
        res.setHeader("Content-Type", result.contentType);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${result.filename}"`,
        );
        res.status(200).send(result.body);
      } catch (error) {
        next(error);
      }
    },
  ],
};
