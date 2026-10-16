// Actual application services, real Atlas + real Gemma; no real email sent.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { parseEnv } from "node:util";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const configured = parseEnv(await readFile(".env", "utf8"));
const database = `kai247_p6_${randomBytes(6).toString("hex")}`;
const password = randomBytes(24).toString("base64url");
const email = `p6-${randomBytes(6).toString("hex")}@example.invalid`;
Object.assign(process.env, configured, {
  NODE_ENV: "development",
  MONGODB_DB: database,
  APP_URL: "http://127.0.0.1:3016",
  AUTH_SECRET: randomBytes(48).toString("base64url"),
  SENTRY_TRACES_SAMPLE_RATE: "1",
});
const { default: Sentry } = await import("@sentry/nextjs");
const {
  telemetryOptions,
  telemetryStatus,
  traceStep,
  captureSafeError,
  flushTelemetry,
} = await import("../src/lib/observability/telemetry.ts");
const { provisionOwner } = await import("../src/lib/auth/provision.ts");
const { createExtraction, confirmExtraction } = await import(
  "../src/lib/extractions/service.ts"
);
const { extractDocumentText } = await import("../src/lib/documents/text.ts");
const { processBatch } = await import("../src/lib/notifications/worker.ts");
const { requestVerification } = await import(
  "../src/lib/notifications/service.ts"
);
const { closeDatabase } = await import("../src/lib/db/client.ts");
const report = {
  utc: new Date().toISOString(),
  dataset:
    "New isolated synthetic Atlas database; real Gemma; explicitly synthetic parse failure; zero real email",
  database,
  configured: telemetryStatus().configured,
  sampleRate: 1,
  spans: [],
  ingestion: [],
  realEmailSent: false,
  outcome: "RUNNING",
};
await mkdir("docs/evidence/p6", { recursive: true });
await mkdir(".local", { recursive: true });
const options = telemetryOptions();
if (report.configured)
  Sentry.init({
    ...options,
    beforeSendSpan(span) {
      const safe = options.beforeSendSpan(span);
      report.spans.push(safe);
      return safe;
    },
    transport(transportOptions) {
      const live = Sentry.makeNodeTransport(transportOptions);
      return {
        async send(envelope) {
          const response = await live.send(envelope);
          report.ingestion.push({
            statusCode: response.statusCode ?? null,
            itemTypes: envelope[1].map((item) => item[0].type),
          });
          return response;
        },
        flush: (timeout) => live.flush(timeout),
      };
    },
  });
let ctx;
try {
  const account = await provisionOwner({
    email,
    password,
    displayName: "Synthetic P6 owner",
    organizationName: "Synthetic P6 security and tracing",
    isDemo: true,
  });
  ctx = { user: account.user, organization: account.organization };
  await writeFile(
    ".local/p6-app-private.json",
    JSON.stringify({
      database,
      email,
      password,
      env: { ...process.env, MONGODB_DB: database },
    }),
    { flag: "w" },
  );
  const form = new FormData();
  form.append(
    "file",
    new File(
      [await readFile("tests/fixtures/documents/insurance-certificate.txt")],
      "insurance-certificate.txt",
      { type: "text/plain" },
    ),
  );
  const extraction = await createExtraction(
    ctx,
    new Request("http://127.0.0.1:3016/api/extractions", {
      method: "POST",
      body: form,
    }),
  );
  report.extraction = {
    id: extraction.id,
    modelId: extraction.modelId,
    elapsedMs: extraction.elapsedMs,
    attempts: extraction.modelAttempts,
    status: extraction.validationStatus,
    dateStatus: extraction.candidateFields.date.status,
    usage: extraction.usage,
  };
  assert.equal(extraction.validationStatus, "pending_review");
  assert.equal(extraction.candidateFields.date.status, "supported");
  const confirmed = await confirmExtraction(ctx, extraction.id, {
    title: "SYNTHETIC P6 confirmed vehicle cover",
    category: "vehicle",
    dueDate: "2027-10-31",
    dateType: "expiry",
    timezone: "Africa/Lagos",
    evidenceChecked: true,
  });
  report.renewalId = confirmed.renewal.id;
  report.reminders = confirmed.reminders;
  report.outcome = "PASS_REAL_GEMMA_AND_APPROVAL";
} catch (error) {
  report.outcome = "FAIL_REAL_WORKFLOW";
  report.errorCode =
    typeof error?.code === "string" && /^[A-Z_]{1,40}$/.test(error.code)
      ? error.code
      : "UNEXPECTED";
  captureSafeError(error);
  process.exitCode = 1;
} finally {
  // Exercise the real verification service with an explicitly injected,
  // non-delivering provider-500 transport. Reserved .test recipient, no network.
  const mailOwner = await provisionOwner({
    email: `synthetic-${randomBytes(6).toString("hex")}@example.test`,
    password,
    displayName: "SYNTHETIC P6 mail transport test",
    organizationName: "SYNTHETIC non-delivering provider failure",
    isDemo: false,
  });
  try {
    await requestVerification(
      { user: mailOwner.user, organization: mailOwner.organization },
      async () => ({
        accepted: false,
        code: "PROVIDER_HTTP_500",
        retryable: true,
      }),
    );
  } catch (error) {
    report.syntheticMailFailure = {
      code: error.code,
      label: "Injected SYNTHETIC provider HTTP 500; no email/network delivery",
    };
  }
  // Deliberately malformed SYNTHETIC bytes; this is not a provider outage.
  try {
    await traceStep("ai_workflow", { synthetic: true }, () =>
      traceStep("parse_document", { synthetic: true }, () =>
        extractDocumentText({
          kind: "pdf",
          bytes: Buffer.from("%PDF-1.7\nSYNTHETIC BROKEN PDF\n%%EOF"),
        }),
      ),
    );
  } catch (error) {
    report.syntheticFailure = {
      code: error.code,
      expected: "MALFORMED_DOCUMENT",
      label: "Deliberately invalid synthetic PDF",
    };
    captureSafeError(error);
  }
  // An unconfigured provider check, never a real recipient or delivering transport.
  const savedKey = process.env.EMAIL_API_KEY;
  delete process.env.EMAIL_API_KEY;
  report.nonDeliveringBatch = await processBatch();
  process.env.EMAIL_API_KEY = savedKey;
  await closeDatabase();
  await flushTelemetry();
  report.sentryAccepted = report.ingestion.some(
    (item) => item.statusCode >= 200 && item.statusCode < 300,
  );
  await writeFile(
    "docs/evidence/p6/real-traces.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    JSON.stringify({
      outcome: report.outcome,
      configured: report.configured,
      sentSpans: report.spans.length,
      sentryAccepted: report.sentryAccepted,
      model: report.extraction?.modelId,
      elapsedMs: report.extraction?.elapsedMs,
      syntheticFailure: report.syntheticFailure,
      realEmailSent: false,
    }),
  );
}
