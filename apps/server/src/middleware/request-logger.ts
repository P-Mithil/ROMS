import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (env.LOG_LEVEL === "debug" || res.statusCode >= 400) {
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      );
    }
  });

  next();
}
