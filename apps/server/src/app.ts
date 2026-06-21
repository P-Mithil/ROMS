import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { NotFoundError } from "./shared/errors/AppError.js";
import { v1Router } from "./routes/v1/index.js";

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api/v1", v1Router);

  app.use((_req, _res, next) => {
    next(new NotFoundError("Route not found"));
  });

  app.use(errorHandler);

  return app;
}
