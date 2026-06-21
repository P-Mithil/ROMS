import { Router, type IRouter } from "express";
import { healthRouter } from "./health.routes.js";

export const v1Router: IRouter = Router();

v1Router.use(healthRouter);
