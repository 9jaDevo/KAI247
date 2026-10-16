import nextEnv from "@next/env";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { validateProductionConfig } from "../src/lib/security/deployment.ts";
process.env.NODE_ENV = "production";
nextEnv.loadEnvConfig(process.cwd(), false);
try {
  validateProductionConfig(process.env);
  const port = process.env.PORT || "10000";
  if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535)
    throw new Error("PORT must be between 1 and 65535.");
  const require = createRequire(import.meta.url);
  const child = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "--hostname",
      "0.0.0.0",
      "--port",
      port,
    ],
    { stdio: "inherit", windowsHide: true },
  );
  child.on("error", () => {
    console.error("Production server failed to start. Details redacted.");
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => child.kill(signal));
} catch (error) {
  // Validation errors name fields/rules only, never secret values.
  console.error(
    error instanceof Error
      ? error.message
      : "Production configuration invalid. Details redacted.",
  );
  process.exitCode = 1;
}
