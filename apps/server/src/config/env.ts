import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../../../../.env") });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CORS_ORIGIN: z.string().url().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  AI_PROVIDER: z.enum(["groq", "openai"]).default("groq"),
  GROQ_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().optional(),
  AI_BASE_URL: z.string().url().optional().or(z.literal("")),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  console.error(`Invalid environment variables:\n${formatted}`);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";

// Provider presets keep the OpenAI SDK usage identical; only credentials,
// base URL, and default model differ. Switching providers is env-only.
const AI_PROVIDER_PRESETS = {
  groq: {
    apiKeyEnvVar: "GROQ_API_KEY",
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openai: {
    apiKeyEnvVar: "OPENAI_API_KEY",
    baseURL: undefined as string | undefined,
    defaultModel: "gpt-4o-mini",
  },
} as const;

const aiPreset = AI_PROVIDER_PRESETS[env.AI_PROVIDER];

export const aiConfig = {
  provider: env.AI_PROVIDER,
  apiKey:
    env.AI_PROVIDER === "groq" ? env.GROQ_API_KEY : env.OPENAI_API_KEY,
  apiKeyEnvVar: aiPreset.apiKeyEnvVar,
  model: env.AI_MODEL?.trim() || aiPreset.defaultModel,
  baseURL: env.AI_BASE_URL?.trim() || aiPreset.baseURL,
  timeoutMs: env.AI_TIMEOUT_MS,
};
