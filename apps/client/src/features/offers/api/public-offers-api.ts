import type { ApiResponse, PublicDeclineOfferRequest, PublicOfferDto } from "@roms/shared";
import { getApiUrl } from "../../../lib/env.js";
import { ApiClientError } from "../../../lib/api-client.js";

function buildUrl(path: string) {
  const baseUrl = getApiUrl().replace(/\/$/, "");
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function publicRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? "GET",
    headers: {
      Accept: "application/json",
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const body = text ? (JSON.parse(text) as ApiResponse<T>) : undefined;

  if (!response.ok || !body || !body.success) {
    const message =
      body && !body.success && "error" in body
        ? body.error.message
        : `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status);
  }

  return body.data;
}

export function getPublicOffer(token: string) {
  return publicRequest<PublicOfferDto>(`/public/offers/${encodeURIComponent(token)}`);
}

export function acceptPublicOffer(token: string) {
  return publicRequest<PublicOfferDto>(
    `/public/offers/${encodeURIComponent(token)}/accept`,
    { method: "POST", body: {} },
  );
}

export function declinePublicOffer(
  token: string,
  body: PublicDeclineOfferRequest,
) {
  return publicRequest<PublicOfferDto>(
    `/public/offers/${encodeURIComponent(token)}/decline`,
    { method: "POST", body },
  );
}
