import bcrypt from "bcrypt";
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserDto,
} from "@roms/shared";
import { env } from "../../config/env.js";
import {
  ConflictError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import { toDepartmentSummary } from "../../shared/utils/user-mapper.js";
import { authRepository } from "../auth/auth.repository.js";
import { usersRepository } from "./users.repository.js";

function toUserDto(user: Awaited<ReturnType<typeof usersRepository.findById>>): UserDto {
  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role.name,
    department: toDepartmentSummary(user.department),
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export const usersService = {
  async list(query: ListUsersQuery) {
    const [users, total] = await usersRepository.findMany(query);

    return {
      items: users.map((user) => toUserDto(user)),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    return toUserDto(user);
  },

  async create(input: CreateUserInput) {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A user with this email already exists");
    }

    const role = await usersRepository.findRoleByName(input.role);
    if (!role) {
      throw new NotFoundError("Role not found");
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

    const user = await usersRepository.create({
      email: input.email,
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      roleId: role.id,
      departmentId: input.departmentId,
    });

    return toUserDto(user);
  },

  async update(id: string, input: UpdateUserInput) {
    const existing = await usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User not found");
    }

    let roleId: string | undefined;
    if (input.role) {
      const role = await usersRepository.findRoleByName(input.role);
      if (!role) {
        throw new NotFoundError("Role not found");
      }
      roleId = role.id;
    }

    const user = await usersRepository.update(id, {
      firstName: input.firstName,
      lastName: input.lastName,
      roleId,
      departmentId: input.departmentId,
    });

    return toUserDto(user);
  },

  async deactivate(id: string) {
    const existing = await usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User not found");
    }

    const user = await usersRepository.update(id, { isActive: false });
    await authRepository.revokeAllUserTokens(id);

    return toUserDto(user);
  },

  async activate(id: string) {
    const existing = await usersRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("User not found");
    }

    const user = await usersRepository.update(id, { isActive: true });
    return toUserDto(user);
  },

  async listInterviewers() {
    const users = await usersRepository.findInterviewers();
    return users.map((user) => toUserDto(user));
  },

  async listHiringManagers() {
    const users = await usersRepository.findHiringManagers();
    return users.map((user) => toUserDto(user));
  },
};
