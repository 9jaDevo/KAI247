import { validateEnv } from "./src/lib/security/env.ts";
import { fileURLToPath } from "node:url";

validateEnv(process.env);

const nextConfig = {
  poweredByHeader: false,
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
};
export default nextConfig;
