import type {
  CreateDepartmentInput,
  DepartmentDto,
  UpdateDepartmentInput,
} from "@roms/shared";
import {
  ConflictError,
  NotFoundError,
} from "../../shared/errors/AppError.js";
import { departmentsRepository } from "./departments.repository.js";

function toDepartmentDto(
  department: NonNullable<
    Awaited<ReturnType<typeof departmentsRepository.findById>>
  >,
): DepartmentDto {
  return {
    id: department.id,
    name: department.name,
    description: department.description,
    isActive: department.isActive,
    createdAt: department.createdAt.toISOString(),
    updatedAt: department.updatedAt.toISOString(),
  };
}

export const departmentsService = {
  async list() {
    const departments = await departmentsRepository.findAll(true);
    return departments.map(toDepartmentDto);
  },

  async getById(id: string) {
    const department = await departmentsRepository.findById(id);
    if (!department) {
      throw new NotFoundError("Department not found");
    }

    return toDepartmentDto(department);
  },

  async create(input: CreateDepartmentInput) {
    const existing = await departmentsRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError("A department with this name already exists");
    }

    const department = await departmentsRepository.create(input);
    return toDepartmentDto(department);
  },

  async update(id: string, input: UpdateDepartmentInput) {
    const existing = await departmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Department not found");
    }

    if (input.name && input.name !== existing.name) {
      const nameTaken = await departmentsRepository.findByName(input.name);
      if (nameTaken) {
        throw new ConflictError("A department with this name already exists");
      }
    }

    const department = await departmentsRepository.update(id, input);
    return toDepartmentDto(department);
  },

  async deactivate(id: string) {
    const existing = await departmentsRepository.findById(id);
    if (!existing) {
      throw new NotFoundError("Department not found");
    }

    const department = await departmentsRepository.update(id, {
      isActive: false,
    });

    return toDepartmentDto(department);
  },
};
