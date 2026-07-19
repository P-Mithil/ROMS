import { ApiClientError } from "../../../lib/api-client.js";

export function formatAiError(error: unknown, fallback = "AI request failed") {
  if (error instanceof ApiClientError) {
    if (error.status === 503) {
      return "AI is unavailable. Set the AI provider key (GROQ_API_KEY by default) on the server to enable AI features.";
    }
    return error.message;
  }
  return fallback;
}

export async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}
