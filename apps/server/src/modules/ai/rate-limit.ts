import { AppError } from "../../shared/errors/AppError.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10 * 60 * 1000;
// Override with AI_RATE_LIMIT_MAX (e.g. while testing); defaults to 20/10min.
const MAX_CALLS = Number(process.env.AI_RATE_LIMIT_MAX) || 20;

export function assertAiRateLimit(userId: string) {
  const now = Date.now();
  const current = buckets.get(userId);

  if (!current || current.resetAt <= now) {
    buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  if (current.count >= MAX_CALLS) {
    throw new AppError(
      429,
      "AI_RATE_LIMITED",
      "Too many AI requests. Try again in a few minutes.",
    );
  }

  current.count += 1;
  buckets.set(userId, current);
}
