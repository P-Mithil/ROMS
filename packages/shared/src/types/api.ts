export type ApiError = {
  code: string;
  message: string;
  details?: unknown[];
};

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export type HealthData = {
  status: string;
  database: string;
  timestamp: string;
};
