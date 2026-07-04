import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import type { RoleName } from "@roms/shared";
import { env } from "../../config/env.js";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: RoleName;
};

export type SignedAccessToken = {
  token: string;
  expiresIn: number;
};

const REFRESH_TOKEN_BYTES = 32;

function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
      return value * 60 * 60 * 24;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

export function getAccessTokenExpiresInSeconds(): number {
  return parseDurationToSeconds(env.JWT_ACCESS_EXPIRES_IN);
}

export function getRefreshTokenExpiresAt(): Date {
  const seconds = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + seconds * 1000);
}

export function signAccessToken(payload: AccessTokenPayload): SignedAccessToken {
  const expiresIn = getAccessTokenExpiresInSeconds();

  const token = jwt.sign(payload, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn,
  });

  return { token, expiresIn };
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ["HS256"],
  });

  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token payload");
  }

  const { sub, email, role } = decoded as AccessTokenPayload;

  if (!sub || !email || !role) {
    throw new Error("Invalid token payload");
  }

  return { sub, email, role };
}

export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
