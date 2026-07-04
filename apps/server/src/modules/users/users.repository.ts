import type { Prisma, RoleName } from "@prisma/client";
import type { ListUsersQuery } from "@roms/shared";
import { prisma } from "../../db/prisma.js";
import { userInclude } from "../../shared/utils/user-mapper.js";

export const usersRepository = {
  findMany(query: ListUsersQuery) {
    const where: Prisma.UserWhereInput = {};

    if (query.role) {
      where.role = { name: query.role as RoleName };
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: "insensitive" } },
        { firstName: { contains: query.search, mode: "insensitive" } },
        { lastName: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    return prisma.$transaction([
      prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take: query.limit,
      }),
      prisma.user.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  },

  findRoleByName(name: RoleName) {
    return prisma.role.findUnique({ where: { name } });
  },

  create(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: string;
    departmentId: string | null;
  }) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
      include: userInclude,
    });
  },

  update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      roleId?: string;
      departmentId?: string | null;
      isActive?: boolean;
      passwordHash?: string;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data,
      include: userInclude,
    });
  },

  findInterviewers() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: "INTERVIEWER" },
      },
      include: userInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },

  findHiringManagers() {
    return prisma.user.findMany({
      where: {
        isActive: true,
        role: { name: "HIRING_MANAGER" },
      },
      include: userInclude,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  },
};
