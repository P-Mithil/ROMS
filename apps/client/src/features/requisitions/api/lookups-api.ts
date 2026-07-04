import type { DepartmentDto, UserDto } from "@roms/shared";
import { apiGet } from "../../../lib/api-client.js";

export function listDepartments() {
  return apiGet<DepartmentDto[]>("/departments");
}

export function listHiringManagers() {
  return apiGet<UserDto[]>("/users/hiring-managers");
}
