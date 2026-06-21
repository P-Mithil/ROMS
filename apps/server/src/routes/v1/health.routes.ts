import { Router, type IRouter } from "express";
import type { HealthData } from "@roms/shared";
import { prisma } from "../../db/prisma.js";

export const healthRouter: IRouter = Router();

healthRouter.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const data: HealthData = {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };

    res.status(200).json({ success: true, data });
  } catch {
    const data: HealthData = {
      status: "degraded",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    };

    res.status(503).json({ success: false, data });
  }
});
