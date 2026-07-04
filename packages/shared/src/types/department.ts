export type DepartmentDto = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDepartmentRequest = {
  name: string;
  description?: string;
};

export type UpdateDepartmentRequest = {
  name?: string;
  description?: string | null;
};
