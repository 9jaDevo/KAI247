import type { Instrumentation } from "next";
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initializeTelemetry } = await import(
      "./lib/observability/telemetry"
    );
    initializeTelemetry();
  }
}
// Request/header/path context is deliberately discarded before capture.
export const onRequestError: Instrumentation.onRequestError = async (error) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { captureSafeError } = await import("./lib/observability/telemetry");
    captureSafeError(error);
  }
};
