import { validateEnv } from "./env.ts";

/** Production launch checks only; builds and PR tests require no provider secrets. */
export function validateProductionConfig(
  input: Record<string, string | undefined>,
) {
  const env = validateEnv({ ...input, NODE_ENV: "production" }, ["auth", "db"]);
  const url = new URL(env.APP_URL);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
  )
    throw new Error(
      "APP_URL must be the public HTTPS origin without credentials, path, query or fragment.",
    );
  return env;
}
