import type { ApiResponse } from "@roms/shared";
import { getApiUrl } from "./env.js";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const baseUrl = getApiUrl().replace(/\/$/, "");
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  const body = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !body.success) {
    const message =
      !body.success && "error" in body
        ? body.error.message
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  return body.data;
}
