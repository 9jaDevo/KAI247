// Default import also supports native Node ESM in the one-shot worker: the
// package's CJS re-exports are not all statically discoverable as named exports.
import Sentry from "@sentry/nextjs";
import { AppError } from "../security/errors.ts";
import {
  safeAttributes,
  safeCode,
  scrubError,
  scrubSpan,
  type Operation,
} from "./privacy.ts";

export function telemetryStatus(
  input: Record<string, string | undefined> = process.env,
) {
  try {
    const url = new URL(input.SENTRY_DSN ?? "");
    return {
      configured:
        url.protocol === "https:" &&
        !!url.username &&
        !url.password &&
        /^\/\d+$/.test(url.pathname),
      sampleRate: samplingRate(input.SENTRY_TRACES_SAMPLE_RATE),
    };
  } catch {
    return {
      configured: false,
      sampleRate: samplingRate(input.SENTRY_TRACES_SAMPLE_RATE),
    };
  }
}
function samplingRate(value?: string) {
  const rate = value?.trim() ? Number(value) : 0.1;
  return Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0.1;
}
export function telemetryOptions(
  input: Record<string, string | undefined> = process.env,
) {
  const status = telemetryStatus(input);
  return {
    dsn: status.configured ? input.SENTRY_DSN : undefined,
    enabled: status.configured,
    environment:
      input.NODE_ENV === "production"
        ? "production"
        : input.NODE_ENV === "test"
          ? "test"
          : "development",
    release: "kai247@0.1.0",
    defaultIntegrations: false as const,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
      graphQL: { document: false, variables: false },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      stackFrameVariables: false,
      frameContextLines: 0,
    },
    tracesSampleRate: status.sampleRate,
    tracePropagationTargets: [],
    includeServerName: false,
    beforeSendLog: () => null,
    beforeSendMetric: () => null,
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    beforeSend: scrubError,
    beforeSendSpan: scrubSpan,
    debug: false,
  } satisfies Parameters<typeof Sentry.init>[0];
}
export function initializeTelemetry() {
  if (Sentry.getClient() || !telemetryStatus().configured) return;
  Sentry.init(telemetryOptions());
}
export function captureSafeError(error: unknown) {
  if (!Sentry.getClient()) return;
  const code = safeCode(error instanceof AppError ? error.code : undefined);
  // Never pass the original exception, request, stack or Zod issues to the SDK.
  Sentry.captureMessage(
    "KAI247 server operation failed; private details omitted.",
    { level: "error", tags: { error_code: code } },
  );
}
export function traceStep<T>(
  name: Operation,
  attributes: Record<string, unknown>,
  action: (annotate: (data: Record<string, unknown>) => void) => T,
): T {
  if (!Sentry.getClient()) return action(() => undefined);
  return Sentry.startSpan(
    {
      name,
      op: name === "gemma_extract" ? "gen_ai.chat" : "function",
      attributes: safeAttributes(attributes),
    },
    (span) => {
      const started = performance.now();
      let rejected = false;
      const annotate = (data: Record<string, unknown>) => {
        const safe = safeAttributes(data);
        if (safe.outcome === "provider_rejected") rejected = true;
        span.setAttributes(safe);
      };
      annotate({ outcome: "success" });
      const success = () => {
        annotate({ duration_ms: performance.now() - started });
        span.setStatus({ code: rejected ? 2 : 1 });
      };
      const failure = (error: unknown) => {
        annotate({
          outcome: "failure",
          duration_ms: performance.now() - started,
          error_code: error instanceof AppError ? error.code : "UNEXPECTED",
        });
        span.setStatus({ code: 2 });
      };
      try {
        const result = action(annotate);
        if (result instanceof Promise)
          return result.then(
            (value) => {
              success();
              return value;
            },
            (error) => {
              failure(error);
              throw error;
            },
          ) as T;
        success();
        return result;
      } catch (error) {
        failure(error);
        throw error;
      }
    },
  );
}
export async function flushTelemetry() {
  if (Sentry.getClient()) await Sentry.flush(2000);
}
