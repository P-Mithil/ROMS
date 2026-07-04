import type { Request, Response, NextFunction } from "express";
import type { RoleName } from "@roms/shared";
import { ForbiddenError } from "../shared/errors/AppError.js";

// Simple role check: "is this user one of the allowed roles?"
export function requireRole(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ForbiddenError("Authentication required"));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError("You do not have access to this resource"));
      return;
    }

    next();
  };
}
