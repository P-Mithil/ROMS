import type { Response } from "express";
import { isProduction } from "../../config/env.js";

const REFRESH_COOKIE_PATH = "/api/v1/auth";
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
  });
}

export function getRefreshTokenFromRequest(
  cookies: Record<string, string | undefined>,
  bodyToken?: string,
): string | undefined {
  return cookies.refreshToken ?? bodyToken;
}
