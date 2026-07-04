import type { Request, Response, NextFunction } from "express";
import {
  changePasswordSchema,
  loginSchema,
} from "@roms/shared";
import { validate } from "../../middleware/validate.js";
import { authService } from "./auth.service.js";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "./cookie.utils.js";

export const authController = {
  login: [
    validate({ body: loginSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await authService.login(req.body);

        setRefreshTokenCookie(res, result.refreshToken);

        res.status(200).json({
          success: true,
          data: {
            accessToken: result.accessToken,
            expiresIn: result.expiresIn,
            user: result.user,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ],

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = getRefreshTokenFromRequest(
        req.cookies as Record<string, string | undefined>,
        typeof req.body?.refreshToken === "string"
          ? req.body.refreshToken
          : undefined,
      );

      if (!refreshToken) {
        res.status(401).json({
          success: false,
          error: {
            code: "TOKEN_INVALID",
            message: "Refresh token is required",
          },
        });
        return;
      }

      const result = await authService.refresh(refreshToken);

      res.status(200).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          expiresIn: result.expiresIn,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = getRefreshTokenFromRequest(
        req.cookies as Record<string, string | undefined>,
        typeof req.body?.refreshToken === "string"
          ? req.body.refreshToken
          : undefined,
      );

      await authService.logout(refreshToken);
      clearRefreshTokenCookie(res);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  changePassword: [
    validate({ body: changePasswordSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await authService.changePassword(req.user!.id, req.body);
        clearRefreshTokenCookie(res);
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  ],
};
