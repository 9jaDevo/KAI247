import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");
const { initializeTelemetry, flushTelemetry, captureSafeError } = await import(
  "../src/lib/observability/telemetry.ts"
);
initializeTelemetry();
const { processBatch } = await import("../src/lib/notifications/worker.ts");
const { closeDatabase } = await import("../src/lib/db/client.ts");
try {
  const result = await processBatch({ limit: 25 });
  console.log(
    JSON.stringify({ ...result, mode: "one-shot", deliveryClaimed: false }),
  );
  if (result.providerUnavailable) process.exitCode = 2;
} catch (error) {
  captureSafeError(error);
  console.error("Reminder batch failed. Details redacted.");
  process.exitCode = 1;
} finally {
  await closeDatabase();
  await flushTelemetry();
}
