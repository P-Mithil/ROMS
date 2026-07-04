import { Router, type IRouter } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authController } from "./auth.controller.js";

export const authRouter: IRouter = Router();

authRouter.post("/login", ...authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authenticate, authController.logout);
authRouter.get("/me", authenticate, authController.me);
authRouter.post(
  "/change-password",
  authenticate,
  ...authController.changePassword,
);
