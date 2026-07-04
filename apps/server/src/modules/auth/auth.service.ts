import bcrypt from "bcrypt";
import type { ChangePasswordInput, LoginInput } from "@roms/shared";
import { env } from "../../config/env.js";
import { UnauthorizedError } from "../../shared/errors/AppError.js";
import { toAuthUser, toAuthenticatedUser } from "../../shared/utils/user-mapper.js";
import { authRepository } from "./auth.repository.js";
import {
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from "./token.service.js";

export const authService = {
  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email.toLowerCase());

    if (!user || !user.isActive) {
      throw new UnauthorizedError(
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    const passwordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedError(
        "Invalid email or password",
        "INVALID_CREDENTIALS",
      );
    }

    const access = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });

    const refreshToken = generateRefreshToken();

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: getRefreshTokenExpiresAt(),
    });

    await authRepository.updateLastLogin(user.id);

    return {
      accessToken: access.token,
      expiresIn: access.expiresIn,
      refreshToken,
      user: toAuthUser(user),
    };
  },

  // Check the refresh token in the database, then issue a new access token.
  // The same refresh token stays valid until it expires or the user logs out.
  async refresh(refreshToken: string) {
    const stored = await authRepository.findRefreshTokenByHash(
      hashRefreshToken(refreshToken),
    );

    if (!stored || stored.revokedAt) {
      throw new UnauthorizedError("Invalid refresh token", "TOKEN_INVALID");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token expired", "TOKEN_EXPIRED");
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedError("Account is inactive");
    }

    const access = signAccessToken({
      sub: stored.user.id,
      email: stored.user.email,
      role: stored.user.role.name,
    });

    return {
      accessToken: access.token,
      expiresIn: access.expiresIn,
    };
  },

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    const stored = await authRepository.findRefreshTokenByHash(
      hashRefreshToken(refreshToken),
    );

    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  },

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or inactive");
    }

    return toAuthUser(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await authRepository.findUserById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or inactive");
    }

    const passwordValid = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedError(
        "Current password is incorrect",
        "INVALID_CREDENTIALS",
      );
    }

    const passwordHash = await bcrypt.hash(
      input.newPassword,
      env.BCRYPT_ROUNDS,
    );

    await authRepository.updatePassword(userId, passwordHash);
    await authRepository.revokeAllUserTokens(userId);
  },

  verifyAccessToken(token: string) {
    return verifyAccessToken(token);
  },

  async resolveAuthenticatedUser(userId: string) {
    const user = await authRepository.findUserById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError("User not found or inactive");
    }

    return toAuthenticatedUser(user);
  },
};
