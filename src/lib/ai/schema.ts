import { z } from "zod";
import { AppError } from "../security/errors.ts";

export const documentTypes = [
  "hosting_invoice",
  "insurance",
  "license",
  "filing_notice",
  "contract",
  "other",
  "unknown",
] as const;
export const candidateDateTypes = [
  "expiry",
  "renewal",
  "filing",
  "payment",
  "service",
  "unknown",
] as const;
export const otherDateTypes = [
  "invoice_issue",
  "payment_due",
  "grace_period_end",
  "filing",
  "service_start",
  "expiry",
  "renewal",
  "other",
] as const;
const currencies = ["NGN", "USD", "GBP", "other"] as const;

const page = z.number().int().min(1).max(1000).nullable();
/** Never trust model JSON: every field is bounded and typed; unknown keys are dropped. */
export const modelOutputSchema = z.object({
  document_type: z.enum(documentTypes),
  service_title: z.string().max(300).nullable(),
  provider: z.string().max(300).nullable(),
  renewal_date: z.object({
    raw: z.string().max(120).nullable(),
    iso: z.string().max(40).nullable(),
    type: z.enum(candidateDateTypes),
    evidence_excerpt: z.string().max(1000).nullable(),
    page,
    ambiguous: z.boolean(),
  }),
  other_dates: z
    .array(
      z.object({
        raw: z.string().max(120),
        iso: z.string().max(40).nullable(),
        type: z.enum(otherDateTypes),
        evidence_excerpt: z.string().max(1000),
        page,
      }),
    )
    .max(20),
  amount: z.object({
    value: z.string().max(60).nullable(),
    currency: z.enum(currencies).nullable(),
  }),
  warnings: z.array(z.string().max(600)).max(20),
});
export type ModelOutput = z.infer<typeof modelOutputSchema>;

const nullableString = { type: ["string", "null"] };
const nullablePage = { type: ["integer", "null"] };
/** JSON Schema sent as `response_format`; the Zod schema above remains authoritative. */
export const responseJsonSchema = {
  type: "object",
  properties: {
    document_type: { type: "string", enum: [...documentTypes] },
    service_title: nullableString,
    provider: nullableString,
    renewal_date: {
      type: "object",
      properties: {
        raw: nullableString,
        iso: nullableString,
        type: { type: "string", enum: [...candidateDateTypes] },
        evidence_excerpt: nullableString,
        page: nullablePage,
        ambiguous: { type: "boolean" },
      },
      required: ["raw", "iso", "type", "evidence_excerpt", "page", "ambiguous"],
    },
    other_dates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          raw: { type: "string" },
          iso: nullableString,
          type: { type: "string", enum: [...otherDateTypes] },
          evidence_excerpt: { type: "string" },
          page: nullablePage,
        },
        required: ["raw", "iso", "type", "evidence_excerpt", "page"],
      },
    },
    amount: {
      type: "object",
      properties: {
        value: nullableString,
        currency: { type: ["string", "null"], enum: [...currencies, null] },
      },
      required: ["value", "currency"],
    },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: [
    "document_type",
    "service_title",
    "provider",
    "renewal_date",
    "other_dates",
    "amount",
    "warnings",
  ],
} as const;

const invalidOutput = () =>
  new AppError(
    502,
    "MODEL_OUTPUT_INVALID",
    "Gemma returned output that failed validation. Nothing was saved; retry the extraction.",
  );

/**
 * Accepts the bare JSON object, tolerating a leading `<thought>` block or a Markdown
 * fence that some Gemma deployments emit. Anything else is rejected.
 */
export function parseModelContent(content: string): ModelOutput {
  const withoutThoughts = content
    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
    .trim();
  const unfenced = withoutThoughts
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  if (!unfenced.startsWith("{") || !unfenced.endsWith("}"))
    throw invalidOutput();
  let parsed: unknown;
  try {
    parsed = JSON.parse(unfenced);
  } catch {
    throw invalidOutput();
  }
  const result = modelOutputSchema.safeParse(parsed);
  if (!result.success) throw invalidOutput();
  return result.data;
}
