import type {
  CandidateDate,
  ExtractionCandidate,
  OtherCandidateDate,
} from "../../types/domain.ts";
import {
  detectDeclaredFormat,
  parseWrittenDate,
  readings,
  type DeclaredFormat,
} from "./date-parse.ts";
import { containsNormalized, locateEvidence } from "./evidence.ts";
import type { ModelOutput } from "./schema.ts";

export interface ValidationContext {
  /** Exactly the page texts sent to the model. */
  pages: string[];
  paged: boolean;
  truncated: boolean;
  /** Business-local YYYY-MM-DD used only for the "already past" warning. */
  today: string;
}
export interface ValidatedExtraction {
  candidate: ExtractionCandidate;
  /** System (deterministic) warnings; model notes are kept separately. */
  warnings: string[];
  verbatimEvidence: string;
}

const ISSUE_WORDS =
  /\b(invoice date|date of issue|issue date|issued(?: on)?|date issued|receipt date|payment received|paid on|date paid|statement date)\b/i;
const RENEWAL_WORDS =
  /\b(renew\w*|expir\w*|valid (?:until|till|through|to)|due|next (?:billing|payment)|end date|ends?|coverage|deadline|lapse\w*)\b/i;
const STATUTORY_WORDS =
  /\b(CAC|corporate affairs commission|annual returns?|statutory|FIRS|tax returns?|filing deadline)\b/i;
const INJECTION_PATTERNS = [
  /ignore (?:all |any |the )?(?:previous|prior|above|earlier|preceding) (?:instructions|prompts|rules)/i,
  /disregard (?:all |any |the )?(?:previous|prior|above|system) /i,
  /\b(?:system|developer) (?:prompt|message|instruction)s?\b/i,
  /\byou are now\b/i,
  /\b(?:AI|LLM)\b[^.\n]{0,40}\b(?:must|should|shall)\b/,
  /\b(?:assistant|language model|Gemma|ChatGPT)\b[^.\n]{0,40}\b(?:must|should|shall)\b/i,
  /\b(?:set|change|report|output|return) the (?:renewal|due|expiry) date\b/i,
  /\bjailbreak|developer mode\b/i,
];

const clean = (value: string | null, max: number) => {
  if (!value) return null;
  const text = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
  return text || null;
};
const formatIso = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));

/** Renewal/service amount in integer minor units, accepted only if written in the document. */
function verifyAmount(
  value: string | null,
  currency: ModelOutput["amount"]["currency"],
  pages: string[],
  warnings: string[],
): ExtractionCandidate["amount"] {
  const raw = clean(value, 40);
  const empty = { raw, minor: null, currency: null, verified: false };
  if (!raw) return empty;
  const digits = raw.replace(/[\s,]/g, "");
  const match = /^(\d{1,12})(?:\.(\d{1,2}))?$/.exec(digits);
  // Compare numbers without thousands separators, on digit boundaries only.
  const plain = pages.join("\n").replace(/(\d)[,  ](?=\d{3}(?!\d))/g, "$1");
  const forms = match
    ? [digits, ...(!match[2] || /^0+$/.test(match[2]) ? [match[1]] : [])]
    : [];
  const written = forms.some((form) =>
    new RegExp(`(?<![\\d.])${form.replace(".", "\\.")}(?!\\d)`).test(plain),
  );
  if (!match || !written) {
    warnings.push(
      "The amount Gemma reported was not found as written in the document, so it was not prefilled.",
    );
    return empty;
  }
  const supported =
    currency === "NGN" || currency === "USD" || currency === "GBP";
  if (!supported)
    warnings.push(
      "The amount's currency is missing or not NGN, USD or GBP. Choose the currency yourself.",
    );
  return {
    raw,
    minor: Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0")),
    currency: supported ? currency : currency === "other" ? "other" : null,
    verified: true,
  };
}

function verifyDate(
  raw: string | null,
  excerpt: string | null,
  page: number | null,
  context: ValidationContext,
  declared: DeclaredFormat,
) {
  if (!raw || !excerpt) return { problem: "missing" as const };
  const evidence = locateEvidence(excerpt, context.pages, page, context.paged);
  if (!evidence) return { problem: "evidence_not_found" as const };
  // A date written inside an instruction aimed at the AI is not business evidence.
  const line = `${evidence.before.split("\n").pop()}${evidence.match}${evidence.after.split("\n")[0]}`;
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(line)))
    return { problem: "injected" as const, evidence };
  let written = raw;
  let repaired = false;
  if (!containsNormalized(evidence.match, raw)) {
    // Observed in live runs: Gemma quotes the evidence exactly but garbles its own
    // copy of the date ("21 October <li>er 2027"). Re-read the date from the
    // verified quote only when that quote contains exactly one readable date.
    const found = datesIn(evidence.match, declared);
    if (found.length !== 1)
      return { problem: "date_not_in_evidence" as const, evidence };
    written = found[0];
    repaired = true;
  }
  const parsed = parseWrittenDate(written, declared);
  if (parsed.kind === "invalid")
    return { problem: "unreadable" as const, evidence };
  return { parsed, evidence, written, repaired };
}

const DATE_EXPRESSIONS =
  /\b(?:\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\d{1,2}(?:st|nd|rd|th)?(?: of)?[ -][A-Za-z]{3,9}\.?,?[ -]\d{4}|[A-Za-z]{3,9}\.? \d{1,2}(?:st|nd|rd|th)?,? \d{4})\b/g;
/** Distinct readable written dates inside a verified quote. */
function datesIn(text: string, declared: DeclaredFormat) {
  const values = new Set<string>();
  for (const match of text.matchAll(DATE_EXPRESSIONS))
    if (parseWrittenDate(match[0], declared).kind !== "invalid")
      values.add(match[0]);
  return [...values];
}

/**
 * Fail-safe validation of untrusted model output against the analysed document text.
 * A date survives only if its verbatim evidence is found AND contains the written date
 * AND that written date parses deterministically. Nothing here creates a Renewal.
 */
export function validateExtraction(
  output: ModelOutput,
  context: ValidationContext,
): ValidatedExtraction {
  const warnings: string[] = [];
  const fullText = context.pages.join("\n");
  const declared = detectDeclaredFormat(fullText);
  const primary = output.renewal_date;
  const result = verifyDate(
    clean(primary.raw, 80),
    primary.evidence_excerpt,
    primary.page,
    context,
    declared,
  );
  const date: CandidateDate = {
    raw: clean(primary.raw, 80),
    iso: null,
    modelIso: clean(primary.iso, 20),
    interpretations: [],
    type: primary.type,
    status: "unsupported",
    evidence: "evidence" in result ? (result.evidence ?? null) : null,
  };
  if ("problem" in result) {
    if (result.problem === "missing") {
      date.status = "missing";
      date.raw = null;
      date.type = "unknown";
      warnings.push(
        "No renewal, expiry or due date with supporting evidence was found. Nothing can be confirmed from this document; enter the renewal manually if you know the date.",
      );
    } else
      warnings.push(
        result.problem === "evidence_not_found"
          ? "Gemma's quoted evidence for the date does not appear in the document, so the date was discarded."
          : result.problem === "date_not_in_evidence"
            ? "The date Gemma reported is not inside its quoted evidence, so the date was discarded."
            : result.problem === "injected"
              ? "The quoted date sits inside instruction-like text aimed at AI systems, so it was discarded."
              : "The written date could not be read as a real calendar date, so it was discarded.",
      );
  } else {
    const { parsed, evidence } = result;
    if (result.repaired) {
      warnings.push(
        `Gemma's copy of the date was garbled ("${date.raw}"), so the date was read directly from its verified quote ("${result.written}"). Check it before confirming.`,
      );
      date.raw = result.written;
    }
    date.interpretations = readings(parsed);
    if (parsed.kind === "ambiguous") {
      date.status = "ambiguous";
      warnings.push(
        `"${date.raw}" can mean ${formatIso(parsed.interpretations[0])} (DD/MM) or ${formatIso(parsed.interpretations[1])} (MM/DD). Choose the intended date.`,
      );
    } else {
      date.iso = parsed.iso;
      date.status = "supported";
      if (declared && /^\d{1,2}[/.-]\d{1,2}[/.-]\d{4}$/.test(date.raw ?? ""))
        warnings.push(
          `The numeric date was read as ${declared === "day_first" ? "DD/MM/YYYY" : "MM/DD/YYYY"} because the document states that format. Check before confirming.`,
        );
      if (date.modelIso && date.modelIso !== parsed.iso)
        warnings.push(
          `Gemma's own conversion (${date.modelIso}) disagreed with the deterministic reading of "${date.raw}" (${parsed.iso}). The deterministic reading is shown.`,
        );
      if (primary.ambiguous) {
        date.status = "ambiguous";
        warnings.push(
          "Gemma marked this date as uncertain. Check the source context before confirming.",
        );
      }
    }
    // A repaired reading is never presented as verified; the owner must decide.
    if (result.repaired && date.status === "supported")
      date.status = "ambiguous";
    const quote = evidence.match;
    if (ISSUE_WORDS.test(quote) && !RENEWAL_WORDS.test(quote)) {
      date.status = "ambiguous";
      warnings.push(
        "The quoted evidence reads like an invoice issue or payment-received date, not a renewal or expiry date.",
      );
    }
    if (/\bgrace\b/i.test(quote)) {
      date.status = "ambiguous";
      warnings.push(
        "The evidence mentions a grace period. A grace-period end is not the main due date; confirm which date applies.",
      );
    }
    if (date.iso && date.iso < context.today)
      warnings.push("This date is already in the past.");
  }
  if (date.type === "unknown" && date.status !== "missing")
    warnings.push(
      "Gemma could not classify the date type. Choose it yourself.",
    );

  const otherDates: OtherCandidateDate[] = [];
  let dropped = 0;
  for (const item of output.other_dates) {
    const raw = clean(item.raw, 80);
    const checked = verifyDate(
      raw,
      item.evidence_excerpt,
      item.page,
      context,
      declared,
    );
    if ("problem" in checked || !raw) {
      dropped++;
      continue;
    }
    const values = readings(checked.parsed);
    if (
      otherDates.some(
        (existing) =>
          existing.raw === checked.written && existing.type === item.type,
      )
    )
      continue;
    otherDates.push({
      raw: checked.written,
      iso: checked.parsed.kind === "exact" ? checked.parsed.iso : null,
      interpretations: values,
      type: item.type,
      evidence: checked.evidence,
    });
  }
  if (dropped)
    warnings.push(
      `${dropped} other date${dropped === 1 ? "" : "s"} reported by Gemma ${dropped === 1 ? "was" : "were"} dropped because the quoted evidence or the written date could not be verified in the document.`,
    );
  const primaryReadings = new Set(date.interpretations);
  const competing = otherDates.filter(
    (item) =>
      (item.type === "expiry" || item.type === "renewal") &&
      item.interpretations.some((value) => !primaryReadings.has(value)),
  );
  if (competing.length) {
    if (date.status === "supported") date.status = "ambiguous";
    warnings.push(
      "The document contains more than one possible renewal or expiry date. Choose the one this record should track.",
    );
  }
  if (
    date.type === "filing" ||
    otherDates.some((item) => item.type === "filing") ||
    STATUTORY_WORDS.test(fullText)
  )
    warnings.push(
      "Filing and statutory deadlines are never calculated by KAI247. Verify any filing date against the official current source before confirming. This is not legal advice.",
    );
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(fullText)))
    warnings.push(
      "This document contains instruction-like text aimed at AI systems. It was treated strictly as data; review every field carefully.",
    );
  if (context.truncated)
    warnings.push(
      "The document was longer than the analysis limit. Text after the limit was not analysed.",
    );

  const providerName = clean(output.provider, 120);
  const candidate: ExtractionCandidate = {
    documentType: output.document_type,
    serviceTitle: clean(output.service_title, 120),
    provider: providerName,
    providerVerified:
      !!providerName && containsNormalized(fullText, providerName),
    date,
    otherDates,
    amount: verifyAmount(
      output.amount.value,
      output.amount.currency,
      context.pages,
      warnings,
    ),
    modelNotes: output.warnings
      .map((note) => clean(note, 300))
      .filter((note): note is string => !!note)
      .slice(0, 8),
  };
  return {
    candidate,
    warnings,
    verbatimEvidence: date.evidence?.match.slice(0, 600) ?? "",
  };
}

/** Every calendar date the owner may confirm without an override acknowledgement. */
export function evidenceBackedDates(candidate: ExtractionCandidate) {
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
