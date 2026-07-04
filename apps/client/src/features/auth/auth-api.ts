import type { AuthUser, LoginRequest, LoginResponse, RefreshResponse } from "@roms/shared";
import { apiGet, apiPost } from "../../lib/api-client.js";

export async function loginRequest(input: LoginRequest): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", input, null);
}

export async function refreshRequest(): Promise<RefreshResponse> {
  return apiPost<RefreshResponse>("/auth/refresh", {}, null);
}

export async function logoutRequest(): Promise<void> {
  await apiPost<void>("/auth/logout", {});
}

export async function meRequest(): Promise<AuthUser> {
  return apiGet<AuthUser>("/auth/me");
}
