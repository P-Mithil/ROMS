import type {
  EmployeeDto,
  ListEmployeesQuery,
  PaginationMeta,
  UpdateEmployeeRequest,
} from "@roms/shared";
import {
  apiGet,
  apiGetWithMeta,
  apiPatch,
} from "../../../lib/api-client.js";

function buildQuery(query: ListEmployeesQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("limit", String(query.limit));
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.departmentId) {
    params.set("departmentId", query.departmentId);
  }
  if (query.requisitionId) {
    params.set("requisitionId", query.requisitionId);
  }
  if (query.search) {
    params.set("search", query.search);
  }
  return params.toString();
}

export async function listEmployees(
  query: ListEmployeesQuery,
): Promise<{ items: EmployeeDto[]; meta: PaginationMeta }> {
  const { data, meta } = await apiGetWithMeta<EmployeeDto[]>(
    `/employees?${buildQuery(query)}`,
  );
  return { items: data, meta };
}

export function getEmployee(id: string) {
  return apiGet<EmployeeDto>(`/employees/${id}`);
}

export function updateEmployee(id: string, body: UpdateEmployeeRequest) {
  return apiPatch<EmployeeDto>(`/employees/${id}`, body);
}
