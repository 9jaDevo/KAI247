// Static render checks for the review page with SYNTHETIC extraction records
// (hand-written; no model call). Interaction is covered by scripts/verify-p3.mjs.
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ExtractionView } from "../../src/types/domain";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}));
const { ExtractionReview } = await import(
  "../../src/components/extraction-review"
);
const { suggestedCategory, evidenceDates } = await import(
  "../../src/lib/extractions/labels"
);

function synthetic(
  overrides: Partial<ExtractionView["candidateFields"]> = {},
): ExtractionView {
  return {
    id: "000000000000000000000abc",
    sourceHash: "a".repeat(64),
    originalFilename: "synthetic.txt",
    modelId: "gemma-4-26b-a4b-it",
    provider: "gemma.example.invalid",
    promptVersion: "p3-extract-v1",
    textExtractionMethod: "txt_utf8",
    pageCount: 1,
    textChars: 300,
    truncated: false,
    modelAttempts: 1,
    elapsedMs: 4200,
    warnings: [],
    verbatimEvidence: "Renews on 21 October 2027.",
    validationStatus: "pending_review",
    createdAt: "2026-10-14T00:00:00Z",
    updatedAt: "2026-10-14T00:00:00Z",
    candidateFields: {
      documentType: "hosting_invoice",
      serviceTitle: "<script>alert(1)</script>",
      provider: "Example Hosting",
      providerVerified: true,
      date: {
        raw: "21 October 2027",
        iso: "2027-10-21",
        modelIso: "2027-10-21",
        interpretations: ["2027-10-21"],
        type: "renewal",
        status: "supported",
        evidence: {
          before: "Plan: Shared\n",
          match: "Renews on 21 October 2027.",
          after: "",
          page: null,
        },
      },
      otherDates: [],
      amount: { raw: null, minor: null, currency: null, verified: false },
      modelNotes: ["<b>ignore</b>"],
      ...overrides,
    },
  };
}

describe("extraction review rendering", () => {
  it("highlights exact evidence, labels status in text and escapes model strings", () => {
    const markup = renderToStaticMarkup(
      <ExtractionReview extraction={synthetic()} timezone="Africa/Lagos" />,
    );
    expect(markup).toContain("<mark>Renews on 21 October 2027.</mark>");
    expect(markup).toContain("Evidence verified");
    expect(markup).toContain("Pending review");
    expect(markup).toContain("gemma-4-26b-a4b-it");
    expect(markup).toContain("Approve &amp; save");
    expect(markup).toContain("Gemma’s own notes (unverified)");
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("<b>ignore</b>");
  });
  it("offers no approval when no evidence-backed date exists", () => {
    const missing = synthetic({
      date: {
        raw: null,
        iso: null,
        modelIso: null,
        interpretations: [],
        type: "unknown",
        status: "missing",
        evidence: null,
      },
    });
    const markup = renderToStaticMarkup(
      <ExtractionReview extraction={missing} timezone="Africa/Lagos" />,
    );
    expect(markup).toContain("No dependable date to confirm");
    expect(markup).toContain("No date found");
    expect(markup).not.toContain("Approve &amp; save");
    expect(evidenceDates(missing.candidateFields).size).toBe(0);
  });
  it("suggests categories from document type and wording, never as a final value", () => {
    const base = synthetic().candidateFields;
    expect(suggestedCategory(base)).toBe("digital_infrastructure");
    expect(
      suggestedCategory({
        ...base,
        documentType: "other",
        serviceTitle: "Domain renewal",
      }),
    ).toBe("digital_infrastructure");
    expect(
      suggestedCategory({
        ...base,
        documentType: "insurance",
        serviceTitle: "Motor insurance",
        provider: "Sample Assurance",
      }),
    ).toBe("vehicle");
    expect(
      suggestedCategory({
        ...base,
        documentType: "filing_notice",
        serviceTitle: "Annual filing",
        provider: null,
      }),
    ).toBe("regulatory_or_filing");
  });
});
