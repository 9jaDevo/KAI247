import type { EvidenceSnippet } from "../../types/domain.ts";

const CONTEXT_CHARS = 160;

interface Normalized {
  text: string;
  /** Original index for each normalized character. */
  map: number[];
}

const equivalents: Record<string, string> = {
  "‘": "'",
  "’": "'",
  "‚": "'",
  "‛": "'",
  "“": '"',
  "”": '"',
  "„": '"',
  "‐": "-",
  "‑": "-",
  "‒": "-",
  "–": "-",
  "—": "-",
  "−": "-",
};

/**
 * Comparison form: Unicode compatibility folding, straight quotes/hyphens, collapsed
 * whitespace and lower case. Wording, digits and punctuation must still match.
 */
function normalize(source: string): Normalized {
  let text = "";
  const map: number[] = [];
  let lastWasSpace = true;
  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (/\s/.test(char)) {
      if (!lastWasSpace) {
        text += " ";
        map.push(index);
      }
      lastWasSpace = true;
      continue;
    }
    lastWasSpace = false;
    const folded = (equivalents[char] ?? char.normalize("NFKC")).toLowerCase();
    for (const part of folded) {
      text += part;
      map.push(index);
    }
  }
  if (text.endsWith(" ")) {
    text = text.slice(0, -1);
    map.pop();
  }
  return { text, map };
}
export const normalizeForMatch = (value: string) => normalize(value).text;

/**
 * Minimises stored snippets: e-mail addresses are always removed; long digit runs
 * (phone/account numbers) are masked in surrounding context, never inside the quoted
 * evidence itself, so dates and amounts stay exact.
 */
export function redactSnippet(value: string, maskDigits = true) {
  const withoutEmail = value.replace(
    /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
    "[email removed]",
  );
  return maskDigits
    ? withoutEmail.replace(/\d(?:[ -]?\d){8,}/g, (digits) =>
        digits.replace(/\d(?=(?:[ -]?\d){4})/g, "•"),
      )
    : withoutEmail;
}

function trimContext(source: string, side: "before" | "after") {
  // At most two lines either side of the quote, then a character cap.
  const lines = source.split("\n");
  const value =
    side === "before"
      ? lines.slice(-3).join("\n")
      : lines.slice(0, 3).join("\n");
  const clipped = value.length < source.length;
  if (value.length <= CONTEXT_CHARS)
    return clipped ? (side === "before" ? `…${value}` : `${value}…`) : value;
  if (side === "before") {
    const cut = value.slice(-CONTEXT_CHARS);
    const space = cut.indexOf(" ");
    return `…${space > 0 && space < 30 ? cut.slice(space + 1) : cut}`;
  }
  const cut = value.slice(0, CONTEXT_CHARS);
  const space = cut.lastIndexOf(" ");
  return `${space > CONTEXT_CHARS - 30 ? cut.slice(0, space) : cut}…`;
}

/**
 * Finds a model-quoted excerpt verbatim (modulo whitespace/quote/case folding) in the
 * analysed page texts. Returns null when the quote is absent or too short to be evidence.
 */
export function locateEvidence(
  excerpt: string,
  pages: string[],
  preferredPage: number | null,
  paged: boolean,
): EvidenceSnippet | null {
  const needle = normalizeForMatch(excerpt);
  if (needle.length < 6) return null;
  const order = pages.map((_, index) => index);
  if (preferredPage && preferredPage <= pages.length)
    order.unshift(order.splice(preferredPage - 1, 1)[0]);
  for (const index of order) {
    const page = normalize(pages[index]);
    const at = page.text.indexOf(needle);
    if (at < 0) continue;
    const start = page.map[at];
    const end = page.map[at + needle.length - 1] + 1;
    const source = pages[index];
    return {
      before: redactSnippet(trimContext(source.slice(0, start), "before")),
      match: redactSnippet(source.slice(start, end), false),
      after: redactSnippet(trimContext(source.slice(end), "after")),
      page: paged ? index + 1 : null,
    };
  }
  return null;
}

/** True when `needle` occurs in `haystack` under the same comparison folding. */
export function containsNormalized(haystack: string, needle: string) {
  const target = normalizeForMatch(needle);
  return target.length > 0 && normalizeForMatch(haystack).includes(target);
}
