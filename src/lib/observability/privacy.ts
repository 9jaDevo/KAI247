import type { ErrorEvent, init } from "@sentry/nextjs";
type StreamedSpanJSON = Parameters<
  NonNullable<NonNullable<Parameters<typeof init>[0]>["beforeSendSpan"]>
>[0];

export const operations = [
  "ai_workflow",
  "parse_document",
  "gemma_extract",
  "validate_candidate",
  "approve_renewal",
  "queue_reminder",
  "send_email",
  "reminder_batch",
  "server_error",
] as const;
export type Operation = (typeof operations)[number];
const codes = new Set([
  "UNEXPECTED",
  "VALIDATION_ERROR",
  "MODEL_OUTPUT_INVALID",
  "AI_TIMEOUT",
  "AI_UNAVAILABLE",
  "AI_NOT_CONFIGURED",
  "AI_MODEL_MISMATCH",
  "AI_RATE_LIMITED",
  "PARSE_TIMEOUT",
  "MALFORMED_DOCUMENT",
  "NO_TEXT_LAYER",
  "EMPTY_TEXT",
  "TOO_MANY_PAGES",
  "PDF_ENCRYPTED",
  "PROVIDER_UNAVAILABLE",
  "PROVIDER_NETWORK",
  "PROVIDER_RESPONSE_INVALID",
  "INVALID_RECIPIENT",
  "NOT_FOUND",
  "EXTRACTION_REVIEWED",
  "NO_EVIDENCE_BACKED_DATE",
  "DATE_NOT_IN_EVIDENCE",
  "BODY_TIMEOUT",
]);
export function safeCode(value: unknown) {
  return typeof value === "string" &&
    (codes.has(value) || /^PROVIDER_HTTP_[1-5]\d{2}$/.test(value))
    ? value
    : "UNEXPECTED";
}
export function safeAttributes(input: Record<string, unknown>) {
  const output: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      [
        "duration_ms",
        "gen_ai.usage.input_tokens",
        "gen_ai.usage.output_tokens",
        "attempt",
        "jobs_created",
        "processed",
        "page_count",
      ].includes(key) &&
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 1e12
    )
      output[key] = value;
    if (
      ["synthetic", "retryable", "provider_unavailable"].includes(key) &&
      typeof value === "boolean"
    )
      output[key] = value;
    if (
      key === "outcome" &&
      [
        "success",
        "failure",
        "provider_accepted",
        "provider_rejected",
        "disabled",
        "scheduled",
      ].includes(String(value))
    )
      output[key] = String(value);
    if (key === "error_code") output[key] = safeCode(value);
    if (
      key === "gen_ai.request.model" &&
      typeof value === "string" &&
      /^gemma-[a-z0-9.-]{1,70}$/i.test(value)
    )
      output[key] = value;
    if (
      key === "text_method" &&
      ["txt_utf8", "pdf_text_layer"].includes(String(value))
    )
      output[key] = String(value);
    if (key === "gen_ai.system" && value === "gemma") output[key] = value;
  }
  return output;
}
/** Rebuild, never recursively redact arbitrary user-controlled payloads. */
export function scrubSpan(span: StreamedSpanJSON): StreamedSpanJSON {
  const name = operations.includes(span.name as Operation)
    ? span.name
    : "server_operation";
  return {
    trace_id: span.trace_id,
    span_id: span.span_id,
    ...(span.parent_span_id ? { parent_span_id: span.parent_span_id } : {}),
    name,
    start_timestamp: span.start_timestamp,
    end_timestamp: span.end_timestamp,
    status: span.status,
    is_segment: span.is_segment,
    attributes: {
      ...safeAttributes(span.attributes),
      "sentry.op": name === "gemma_extract" ? "gen_ai.chat" : "function",
      ...(name === "gemma_extract"
        ? {
            "gen_ai.operation.type": "ai_client",
            "gen_ai.operation.name": "chat",
          }
        : {}),
    },
  };
}
export function scrubError(event: ErrorEvent): ErrorEvent {
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: "javascript",
    level: "error",
    message: "KAI247 server operation failed; private details omitted.",
    tags: { error_code: safeCode(event.tags?.error_code) },
    ...(event.contexts?.trace
      ? {
          contexts: {
            trace: {
              trace_id: event.contexts.trace.trace_id,
              span_id: event.contexts.trace.span_id,
            },
          },
        }
      : {}),
  };
}
