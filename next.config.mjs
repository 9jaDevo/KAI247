import { validateEnv } from "./src/lib/security/env.ts";
import { fileURLToPath } from "node:url";
import { withSentryConfig } from "@sentry/nextjs/config";

validateEnv(process.env);

const nextConfig = {
  poweredByHeader: false,
  turbopack: { root: fileURLToPath(new URL(".", import.meta.url)) },
};
export default withSentryConfig(nextConfig, {
  silent: true,
  sourcemaps: { disable: true },
  webpack: {
    autoInstrumentServerFunctions: false,
    autoInstrumentMiddleware: false,
    autoInstrumentAppDirectory: false,
  },
});
