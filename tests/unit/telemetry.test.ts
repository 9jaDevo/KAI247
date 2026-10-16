// Real SDK with SYNTHETIC in-memory transport, never a Sentry ingestion proof.
import { afterAll, describe, expect, it } from "vitest";
import * as Sentry from "@sentry/nextjs";
import {
  scrubError,
  scrubSpan,
  safeAttributes,
} from "../../src/lib/observability/privacy.ts";
import {
  telemetryOptions,
  telemetryStatus,
  traceStep,
  captureSafeError,
} from "../../src/lib/observability/telemetry.ts";
import { AppError } from "../../src/lib/security/errors.ts";
const canary =
  "PRIVATE_document_owner@example.invalid_Bearer_secret_6ad1b96294e6210a92c21412";
const envelopes: unknown[] = [];
afterAll(async () => {
  await Sentry.close(2000);
});
describe("telemetry privacy and lifecycle", () => {
  it("disables absent/invalid DSN and bounds sampling", () => {
    expect(telemetryStatus({})).toEqual({ configured: false, sampleRate: 0.1 });
    expect(
      telemetryStatus({
        SENTRY_DSN: "http://not-a-dsn",
        SENTRY_TRACES_SAMPLE_RATE: "2",
      }).configured,
    ).toBe(false);
    expect(telemetryStatus({ SENTRY_TRACES_SAMPLE_RATE: "0" }).sampleRate).toBe(
      0,
    );
    expect(telemetryOptions({}).defaultIntegrations).toBe(false);
    expect(telemetryOptions({}).dataCollection.genAI).toEqual({
      inputs: false,
      outputs: false,
    });
  });
  it("rebuilds spans/errors with an allowlist, stripping nested payloads and links", () => {
    const span = scrubSpan({
      trace_id: "a".repeat(32),
      span_id: "b".repeat(16),
      name: canary,
      start_timestamp: 1,
      end_timestamp: 2,
      status: "error",
      is_segment: true,
      attributes: {
        prompt: canary,
        "url.full": canary,
        "gen_ai.usage.input_tokens": 12,
        "gen_ai.request.model": canary,
      },
      links: [
        {
          trace_id: "c".repeat(32),
          span_id: "d".repeat(16),
          attributes: { data: canary },
        },
      ],
    });
    const event = scrubError({
      type: undefined,
      message: canary,
      request: { data: canary },
      user: { email: canary },
      extra: { nested: { body: canary } },
      breadcrumbs: [{ message: canary }],
      tags: { error_code: canary },
    });
    expect(JSON.stringify([span, event])).not.toContain(canary);
    expect(span.attributes).toMatchObject({ "gen_ai.usage.input_tokens": 12 });
    expect(event).not.toHaveProperty("request");
    expect(span).not.toHaveProperty("links");
    expect(span.name).toBe("server_operation");
    expect(
      safeAttributes({ duration_ms: NaN, attempt: -1, error_code: canary }),
    ).toEqual({ error_code: "UNEXPECTED" });
  });
  it("emits actual SDK spans with measured duration/status and no private canaries", async () => {
    Sentry.init({
      ...telemetryOptions({
        NODE_ENV: "test",
        SENTRY_DSN: "https://synthetic@o0.ingest.sentry.io/1",
        SENTRY_TRACES_SAMPLE_RATE: "1",
      }),
      transport: () => ({
        send: async (envelope: unknown) => {
          envelopes.push(envelope);
          return { statusCode: 200 };
        },
        flush: async () => true,
      }),
    });
    await traceStep(
      "ai_workflow",
      { synthetic: true, document: canary },
      async () => {
        await traceStep(
          "gemma_extract",
          {
            "gen_ai.request.model": "gemma-4-26b-a4b-it",
            "gen_ai.usage.input_tokens": 19,
          },
          async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
          },
        );
        await expect(
          traceStep("validate_candidate", {}, async () => {
            throw new AppError(502, "MODEL_OUTPUT_INVALID", canary);
          }),
        ).rejects.toThrow(canary);
      },
    );
    Sentry.setUser({ email: canary, id: canary });
    Sentry.setContext("private", { text: canary });
    captureSafeError(new Error(canary));
    await Sentry.flush(2000);
    const text = JSON.stringify(envelopes);
    expect(envelopes.length).toBeGreaterThan(0);
    expect(text).not.toContain(canary);
    expect(text).toContain("gemma_extract");
    expect(text).toContain("MODEL_OUTPUT_INVALID");
    expect(text).toContain("duration_ms");
    expect(text).toContain("gen_ai.usage.input_tokens");
  });
});
