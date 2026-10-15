import type {
  ExtractionCandidate,
  ExtractionView,
  OtherDateType,
  RenewalCategory,
} from "../../types/domain.ts";

type Tone = "neutral" | "teal" | "amber" | "red";

/** Text labels carry the meaning; colour is only reinforcement. */
export const dateStatusLabels: Record<
  ExtractionCandidate["date"]["status"],
  readonly [string, Tone]
> = {
  supported: ["Evidence verified", "teal"],
  ambiguous: ["Needs your decision", "amber"],
  unsupported: ["Date discarded", "red"],
  missing: ["No date found", "neutral"],
};
export const reviewLabels: Record<
  ExtractionView["validationStatus"],
  readonly [string, Tone]
> = {
  pending_review: ["Pending review", "amber"],
  confirmed: ["Confirmed", "teal"],
  rejected: ["Declined", "neutral"],
};
export const otherDateLabels: Record<OtherDateType, string> = {
  invoice_issue: "Invoice issue date",
  payment_due: "Payment due",
  grace_period_end: "Grace period end",
  filing: "Filing date (verify officially)",
  service_start: "Service / cover start",
  expiry: "Expiry",
  renewal: "Renewal",
  other: "Other date",
};
export const documentTypeLabels: Record<
  ExtractionCandidate["documentType"],
  string
> = {
  hosting_invoice: "Hosting invoice",
  insurance: "Insurance",
  license: "Licence / permit",
  filing_notice: "Filing notice",
  contract: "Contract",
  other: "Other document",
  unknown: "Unknown document type",
};

export function suggestedCategory(
  candidate: ExtractionCandidate,
): RenewalCategory {
  const words = `${candidate.serviceTitle ?? ""} ${candidate.provider ?? ""}`;
  if (
    candidate.documentType === "hosting_invoice" ||
    /\b(domain|hosting|website|web|ssl|server|cloud|email)\b/i.test(words)
  )
    return "digital_infrastructure";
  if (/\b(motor|vehicle|car|van|truck|fleet)\b/i.test(words)) return "vehicle";
  if (
    candidate.documentType === "license" ||
    candidate.documentType === "filing_notice"
  )
    return "regulatory_or_filing";
  return "contract_or_other";
}

/** Same rule the server enforces: dates the owner may pick without an override. */
export function evidenceDates(candidate: ExtractionCandidate) {
  const values = new Set<string>();
  if (
    candidate.date.status === "supported" ||
    candidate.date.status === "ambiguous"
  )
    candidate.date.interpretations.forEach((value) => values.add(value));
  candidate.otherDates.forEach((item) =>
    item.interpretations.forEach((value) => values.add(value)),
  );
  return values;
}
