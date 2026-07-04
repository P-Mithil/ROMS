import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../shared/errors/AppError.js";
import { authService } from "../modules/auth/auth.service.js";

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);

    if (!token) {
      throw new UnauthorizedError("Access token is required");
    }

    const payload = authService.verifyAccessToken(token);
    const user = await authService.resolveAuthenticatedUser(payload.sub);

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError("Invalid or expired access token", "TOKEN_INVALID"));
      return;
    }

    next(error);
  }
}
