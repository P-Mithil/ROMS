import type { ApiResponse, PaginationMeta } from "@roms/shared";
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

let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  credentials?: RequestCredentials;
};

function buildUrl(path: string) {
  const baseUrl = getApiUrl().replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function authHeaders(token: string | null): HeadersInit {
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

type RefreshResponseBody = {
  accessToken: string;
  expiresIn: number;
};

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({}),
    });

    const body = await parseJsonBody<ApiResponse<RefreshResponseBody>>(response);

    if (!response.ok || !body || !body.success) {
      setAccessToken(null);
      return null;
    }

    setAccessToken(body.data.accessToken);
    return body.data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

async function parseJsonBody<T>(response: Response): Promise<T | undefined> {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();
  if (!text) {
    return undefined;
  }

  return JSON.parse(text) as T;
}

async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  async function executeRequest(tokenOverride?: string | null) {
    const token =
      tokenOverride !== undefined
        ? tokenOverride
        : options.token !== undefined
          ? options.token
          : currentAccessToken;
    const method = options.method ?? "GET";
    const headers: HeadersInit = {
      ...authHeaders(token),
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    };

    const response = await fetch(buildUrl(path), {
      method,
      headers,
      credentials: options.credentials ?? "include",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const body = await parseJsonBody<ApiResponse<T>>(response);
    return { response, body };
  }

  let { response, body } = await executeRequest();

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      ({ response, body } = await executeRequest(refreshedToken));
    }
  }

  if (!response.ok || (body && "success" in body && !body.success)) {
    const message =
      body && !body.success && "error" in body
        ? body.error.message
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  if (!body || !("data" in body)) {
    return undefined as T;
  }

  return body.data;
}

export async function apiGet<T>(path: string, token?: string | null): Promise<T> {
  return apiRequest<T>(path, { token });
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { method: "POST", body, token });
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  token?: string | null,
): Promise<T> {
  return apiRequest<T>(path, { method: "PATCH", body, token });
}

export async function apiDelete(
  path: string,
  token?: string | null,
): Promise<void> {
  await apiRequest<void>(path, { method: "DELETE", token });
}

export async function apiPostFormData<T>(
  path: string,
  formData: FormData,
  token?: string | null,
): Promise<T> {
  async function executeRequest(tokenOverride?: string | null) {
    const resolvedToken =
      tokenOverride !== undefined ? tokenOverride : token ?? currentAccessToken;

    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: authHeaders(resolvedToken),
      credentials: "include",
      body: formData,
    });

    const body = await parseJsonBody<ApiResponse<T>>(response);
    return { response, body };
  }

  let { response, body } = await executeRequest();

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      ({ response, body } = await executeRequest(refreshedToken));
    }
  }

  if (!response.ok || (body && "success" in body && !body.success)) {
    const message =
      body && !body.success && "error" in body
        ? body.error.message
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  if (!body || !("data" in body)) {
    return undefined as T;
  }

  return body.data;
}

export async function downloadAuthenticatedFile(
  path: string,
  fileName: string,
): Promise<void> {
  async function executeRequest(tokenOverride?: string | null) {
    const response = await fetch(buildUrl(path), {
      headers: authHeaders(tokenOverride ?? currentAccessToken),
      credentials: "include",
    });
    return response;
  }

  let response = await executeRequest();

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      response = await executeRequest(refreshedToken);
    }
  }

  if (!response.ok) {
    const body = await parseJsonBody<ApiResponse<unknown>>(response);
    const message =
      body && !body.success && "error" in body
        ? body.error.message
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

type ApiResponseWithMeta<T, TExtra extends object = Record<string, never>> = ApiResponse<T> &
  TExtra & {
  meta?: PaginationMeta;
};

export async function apiGetWithMeta<T, TExtra extends object = Record<string, never>>(
  path: string,
  token?: string | null,
): Promise<{ data: T; meta: PaginationMeta } & TExtra> {
  async function executeRequest(tokenOverride?: string | null) {
    const resolvedToken =
      tokenOverride !== undefined
        ? tokenOverride
        : token !== undefined
          ? token
          : currentAccessToken;

    const response = await fetch(buildUrl(path), {
      headers: authHeaders(resolvedToken),
      credentials: "include",
    });

    const body = await parseJsonBody<ApiResponseWithMeta<T, TExtra>>(response);
    return { response, body };
  }

  let { response, body } = await executeRequest();

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) {
      ({ response, body } = await executeRequest(refreshedToken));
    }
  }

  if (!response.ok || !body || !body.success) {
    const message =
      body && !body.success && "error" in body
        ? body.error.message
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  if (!body.meta) {
    throw new ApiClientError("Response is missing pagination metadata", 500);
  }

  return { ...body, data: body.data, meta: body.meta };
}
