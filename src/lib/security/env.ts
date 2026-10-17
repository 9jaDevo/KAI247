import { z } from "zod";

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(1).optional(),
);
const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .url()
    .refine((value) => /^https?:\/\//.test(value))
    .optional(),
);
const schema = z.object({
  SITE_URL: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z
      .url()
      .refine((value) => {
        if (!URL.canParse(value)) return false;
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          !url.username &&
          !url.password &&
          url.pathname === "/" &&
          !url.search &&
          !url.hash
        );
      })
      .optional(),
  ),
  APP_URL: z
    .url()
    .refine((value) => /^https?:\/\//.test(value))
    .default("http://localhost:3000"),
  AUTH_SECRET: optionalText,
  MONGODB_URI: optionalText,
  MONGODB_DB: optionalText,
  GEMMA_API_BASE_URL: optionalUrl,
  GEMMA_MODEL_ID: optionalText,
  GEMMA_API_KEY: optionalText,
  EMAIL_API_KEY: optionalText,
  EMAIL_FROM: optionalText,
  SENTRY_DSN: optionalUrl,
  SENTRY_TRACES_SAMPLE_RATE: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.coerce.number().min(0).max(1).optional(),
  ),
});

export type EnvironmentCapability = "auth" | "db" | "ai" | "notifications";
const requiredFor = {
  auth: ["APP_URL", "AUTH_SECRET"],
  db: ["MONGODB_URI", "MONGODB_DB"],
  ai: ["GEMMA_API_BASE_URL", "GEMMA_MODEL_ID", "GEMMA_API_KEY"],
  notifications: ["EMAIL_API_KEY", "EMAIL_FROM"],
} as const;

/** Server-only configuration. Never return values to a client or log raw input. */
export function validateEnv(
  input: Record<string, string | undefined>,
  capabilities: EnvironmentCapability[] = [],
) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fields = [
      ...new Set(result.error.issues.map((issue) => issue.path[0])),
    ];
    throw new Error(
      `Invalid environment configuration: ${fields.join(", ")}. Check .env.example; values are redacted.`,
    );
  }
  const env = result.data;
  const missing = new Set<string>();
  for (const capability of capabilities) {
    for (const key of requiredFor[capability]) {
      if (!env[key]) missing.add(key);
    }
  }
  if (capabilities.includes("auth")) {
    if (env.AUTH_SECRET && env.AUTH_SECRET.length < 32)
      throw new Error(
        "AUTH_SECRET must contain at least 32 characters. Value redacted.",
      );
    if (input.NODE_ENV === "production" && !env.APP_URL.startsWith("https://"))
      throw new Error("APP_URL must use HTTPS for production authentication.");
  }
  if (
    capabilities.includes("db") &&
    env.MONGODB_URI &&
    !/^mongodb(\+srv)?:\/\//.test(env.MONGODB_URI)
  )
    throw new Error(
      "MONGODB_URI must use mongodb:// or mongodb+srv://. Value redacted.",
    );
  if (missing.size)
    throw new Error(
      `Missing required environment configuration: ${[...missing].join(", ")}.`,
    );
  if (
    capabilities.includes("db") &&
    env.MONGODB_DB &&
    !/^[a-zA-Z0-9_-]{1,64}$/.test(env.MONGODB_DB)
  )
    throw new Error(
      "MONGODB_DB must be a simple database name of 1–64 characters. Value redacted.",
    );
  if (
    capabilities.includes("db") &&
    input.NODE_ENV === "production" &&
    env.MONGODB_URI &&
    !/^mongodb\+srv:\/\/[^/]+@[^/]+\.mongodb\.net(?:\/|$)/.test(env.MONGODB_URI)
  )
    throw new Error(
      "Production requires an authenticated MongoDB Atlas SRV connection. Local MongoDB is development-only. Value redacted.",
    );
  return env;
}
