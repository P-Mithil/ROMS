import { prisma } from "../../db/prisma.js";

export const departmentsRepository = {
  findAll(activeOnly = true) {
    return prisma.department.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: "asc" },
    });
  },

  findById(id: string) {
    return prisma.department.findUnique({ where: { id } });
  },

  findByName(name: string) {
    return prisma.department.findUnique({ where: { name } });
  },

  create(data: { name: string; description?: string }) {
    return prisma.department.create({ data });
  },

  update(
    id: string,
    data: { name?: string; description?: string | null; isActive?: boolean },
  ) {
    return prisma.department.update({ where: { id }, data });
  },
};
