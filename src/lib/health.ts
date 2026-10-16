import { getClient } from "./db/client.ts";
import { validateEnv } from "./security/env.ts";
import { validateProductionConfig } from "./security/deployment.ts";

/** Public readiness: no addresses, topology, keys, versions, exception text or provider claims. */
export async function readiness(checkDatabase?: () => Promise<unknown>) {
  const headers = { "Cache-Control": "no-store, max-age=0" };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const env =
      process.env.NODE_ENV === "production"
        ? validateProductionConfig(process.env)
        : validateEnv(process.env, ["auth", "db"]);
    const ping = async () => {
      if (checkDatabase) return checkDatabase();
      return (await getClient())
        .db(env.MONGODB_DB)
        .command({ ping: 1 }, { timeoutMS: 3000 });
    };
    await Promise.race([
      ping(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Not ready")), 4000);
      }),
    ]);
    return Response.json(
      { success: true, data: { status: "ready" } },
      { headers },
    );
  } catch {
    return Response.json(
      {
        success: false,
        error: { code: "NOT_READY", message: "Service is not ready." },
      },
      { status: 503, headers },
    );
  } finally {
    clearTimeout(timer);
  }
}
