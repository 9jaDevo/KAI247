// Evaluation-only baseline and scorer. Never used as a product AI fallback.
export const fields = [
  "documentType",
  "provider",
  "rawDate",
  "date",
  "dateType",
  "dateStatus",
  "interpretations",
  "evidence",
  "amountMinor",
  "currency",
];
const normalized = (value) =>
  typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().toLowerCase()
    : value;
const sameSet = (a, b) =>
  JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
export function candidateFields(candidate) {
  return {
    documentType: candidate.documentType,
    provider: candidate.provider,
    rawDate: candidate.date.raw,
    date: candidate.date.iso,
    dateType: candidate.date.type,
    dateStatus: candidate.date.status,
    interpretations: candidate.date.interpretations,
    evidence: candidate.date.evidence?.match ?? null,
    amountMinor: candidate.amount.minor,
    currency: candidate.amount.currency,
  };
}
export function score(document, actual) {
  const r = document.reference;
  // A failed inference gets no free points for fields whose reference is null.
  if (!actual) return Object.fromEntries(fields.map((field) => [field, false]));
  return {
    documentType: actual.documentType === r.documentType,
    provider: normalized(actual.provider) === normalized(r.provider),
    rawDate: r.rawDates.some(
      (value) => normalized(actual.rawDate) === normalized(value),
    ),
    date: r.dates.includes(actual.date),
    dateType: actual.dateType === r.dateType,
    dateStatus: actual.dateStatus === r.dateStatus,
    interpretations:
      r.interpretations === null
        ? actual.interpretations.length > 0 &&
          actual.interpretations.every((value) => r.dates.includes(value))
        : sameSet(actual.interpretations, r.interpretations),
    evidence:
      r.evidenceAnchors.length === 0
        ? !actual.evidence
        : typeof actual.evidence === "string" &&
          normalized(document.text).includes(normalized(actual.evidence)) &&
          r.evidenceAnchors.some((anchor) =>
            normalized(actual.evidence).includes(normalized(anchor)),
          ),
    amountMinor: actual.amountMinor === r.amountMinor,
    currency: actual.currency === r.currency,
  };
}
function iso(year, month, day) {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
    ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    : null;
}
const monthNames = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];
function baselineDate(raw, text) {
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (m) {
    const date = iso(+m[1], +m[2], +m[3]);
    return {
      date,
      interpretations: date ? [date] : [],
      dateStatus: date ? "supported" : "unsupported",
    };
  }
  m = /^(\d{1,2})\/([0-9]{1,2})\/(\d{4})$/.exec(raw);
  if (m) {
    const a = +m[1],
      b = +m[2],
      y = +m[3];
    const declared = /DD\/MM\/YYYY/.test(text);
    if (a <= 12 && b <= 12 && a !== b && !declared) {
      return {
        date: null,
        interpretations: [iso(y, a, b), iso(y, b, a)].filter(Boolean),
        dateStatus: "ambiguous",
      };
    }
    const date = iso(y, b, a);
    return {
      date,
      interpretations: date ? [date] : [],
      dateStatus: date ? "supported" : "unsupported",
    };
  }
  m = /^(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(raw);
  const date = m
    ? iso(+m[3], monthNames.indexOf(m[2].toLowerCase()) + 1, +m[1])
    : null;
  return {
    date,
    interpretations: date ? [date] : [],
    dateStatus: date ? "supported" : "unsupported",
  };
}
/** Deliberately simple, fixed comparator: first dated line and first currency amount. */
export function regexBaseline(text) {
  const lines = text.split("\n");
  const dated = lines
    .map((line) => ({
      line,
      match:
        /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2} [A-Za-z]+ \d{4})\b/.exec(
          line,
        ),
    }))
    .find((item) => item.match);
  const money = /\b(NGN|USD|GBP)\s+(\d[\d,]*(?:\.\d{1,2})?)/.exec(text);
  const documentType = /filing notice/i.test(text)
    ? "filing_notice"
    : /insurance policy/i.test(text)
      ? "insurance"
      : /licen[cs]e/i.test(text)
        ? "license"
        : /hosting invoice/i.test(text)
          ? "hosting_invoice"
          : /contract/i.test(text)
            ? "contract"
            : "other";
  const dateType = !dated
    ? "unknown"
    : /renew/i.test(dated.line)
      ? "renewal"
      : /filing/i.test(dated.line)
        ? "filing"
        : /expir|valid until/i.test(dated.line)
          ? "expiry"
          : /payment|due/i.test(dated.line)
            ? "payment"
            : "unknown";
  return {
    documentType,
    provider: /^Provider:\s*(.+)$/m.exec(text)?.[1] ?? null,
    rawDate: dated?.match?.[0] ?? null,
    ...(dated
      ? baselineDate(dated.match[0], text)
      : { date: null, dateStatus: "missing", interpretations: [] }),
    dateType,
    evidence: dated?.line ?? null,
    amountMinor: money
      ? Math.round(Number(money[2].replaceAll(",", "")) * 100)
      : null,
    currency: money?.[1] ?? null,
  };
}
export function summarize(rows, method) {
  const perField = Object.fromEntries(
    fields.map((field) => [
      field,
      {
        correct: rows.filter((row) => row[method].scores[field]).length,
        total: rows.length,
      },
    ]),
  );
  return {
    documents: rows.length,
    completed: rows.filter((row) => row[method].actual !== null).length,
    strictAllFields: rows.filter((row) =>
      Object.values(row[method].scores).every(Boolean),
    ).length,
    perField,
  };
}
export function latencySummary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return { n: 0, medianMs: null, p95Ms: null };
  const n = sorted.length;
  return {
    n,
    medianMs:
      n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2,
    p95Ms: n >= 20 ? sorted[Math.ceil(n * 0.95) - 1] : null,
    p95Note:
      n < 20
        ? "Not reported: fewer than 20 document observations; median only, no population tail claim."
        : "Nearest-rank empirical p95; small convenience sample, not a production SLA.",
    minMs: sorted[0],
    maxMs: sorted[n - 1],
  };
}
export function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
