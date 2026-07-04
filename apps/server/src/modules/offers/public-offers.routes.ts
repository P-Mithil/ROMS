import { Router, type IRouter } from "express";
import { publicOffersController } from "./offers.controller.js";

export const publicOffersRouter: IRouter = Router();

publicOffersRouter.get("/offers/:token", ...publicOffersController.getByToken);
publicOffersRouter.post("/offers/:token/accept", ...publicOffersController.accept);
publicOffersRouter.post(
  "/offers/:token/decline",
  ...publicOffersController.decline,
);
