import { validDate } from "../renewals/validation.ts";

export type WrittenDate =
  | { kind: "exact"; iso: string }
  | { kind: "ambiguous"; interpretations: [string, string] }
  | { kind: "invalid" };
export type DeclaredFormat = "day_first" | "month_first" | null;

const months: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};
const weekday =
  /^(?:mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)(?:day|sday|nesday|rsday|urday)?\.?,?\s+/i;

function iso(year: number, month: number, day: number) {
  const value = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return validDate(value) ? value : null;
}
const exact = (value: string | null): WrittenDate =>
  value ? { kind: "exact", iso: value } : { kind: "invalid" };

/** Explicit format statements in the document can resolve numeric DD/MM vs MM/DD. */
export function detectDeclaredFormat(text: string): DeclaredFormat {
  const dayFirst = /\bDD[/.-]MM[/.-](?:YYYY|YY)\b/i.test(text);
  const monthFirst = /\bMM[/.-]DD[/.-](?:YYYY|YY)\b/i.test(text);
  return dayFirst === monthFirst
    ? null
    : dayFirst
      ? "day_first"
      : "month_first";
}

/**
 * Deterministic reading of a date exactly as written. Nigerian documents usually use
 * DD/MM/YYYY, but a numeric date where both parts are ≤ 12 is ambiguous unless the
 * document declares its format. Two-digit years are not guessed.
 */
export function parseWrittenDate(
  raw: string,
  declared: DeclaredFormat = null,
): WrittenDate {
  const value = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,]$/, "")
    .replace(weekday, "");
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(value);
  if (match) return exact(iso(+match[1], +match[2], +match[3]));
  match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(value);
  if (match) {
    const [a, b, year] = [+match[1], +match[2], +match[3]];
    if (a > 12 && b > 12) return { kind: "invalid" };
    if (a > 12) return exact(iso(year, b, a));
    if (b > 12) return exact(iso(year, a, b));
    if (a === b || declared === "day_first") return exact(iso(year, b, a));
    if (declared === "month_first") return exact(iso(year, a, b));
    const dayFirst = iso(year, b, a);
    const monthFirst = iso(year, a, b);
    return dayFirst && monthFirst
      ? { kind: "ambiguous", interpretations: [dayFirst, monthFirst] }
      : { kind: "invalid" };
  }
  match =
    /^(\d{1,2})(?:st|nd|rd|th)?(?: of)?[ -]([A-Za-z]{3,9})\.?,?[ -](\d{4})$/i.exec(
      value,
    );
  if (match) {
    const month = months[match[2].toLowerCase()];
    return month
      ? exact(iso(+match[3], month, +match[1]))
      : { kind: "invalid" };
  }
  match = /^([A-Za-z]{3,9})\.? (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})$/i.exec(
    value,
  );
  if (match) {
    const month = months[match[1].toLowerCase()];
    return month
      ? exact(iso(+match[3], month, +match[2]))
      : { kind: "invalid" };
  }
  return { kind: "invalid" };
}

/** Every calendar date a written value could mean (empty when unreadable). */
export function readings(result: WrittenDate) {
  return result.kind === "exact"
    ? [result.iso]
    : result.kind === "ambiguous"
      ? [...result.interpretations]
      : [];
}
