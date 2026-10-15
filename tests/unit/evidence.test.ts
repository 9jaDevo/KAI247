import { describe, expect, it } from "vitest";
import {
  containsNormalized,
  locateEvidence,
  redactSnippet,
} from "../../src/lib/ai/evidence.ts";

const pages = [
  "Invoice date: 14/10/2026\nAmount due: NGN 85,000.00",
  "Renewal terms\nYour hosting plan renews on 21 October 2027.  Renew before this date.",
];

describe("verbatim evidence checks", () => {
  it("finds an exact quote, returns original text, page and context", () => {
    const found = locateEvidence(
      "Your hosting plan renews on 21 October 2027.",
      pages,
      null,
      true,
    );
    expect(found?.page).toBe(2);
    expect(found?.match).toBe("Your hosting plan renews on 21 October 2027.");
    expect(found?.before).toBe("Renewal terms\n");
    expect(found?.after).toContain("Renew before this date.");
  });
  it("tolerates whitespace, case and typographic quote/dash differences only", () => {
    expect(
      locateEvidence(
        "your hosting  plan RENEWS on 21 October 2027",
        pages,
        2,
        true,
      )?.match,
    ).toBe("Your hosting plan renews on 21 October 2027");
    expect(
      containsNormalized("Valid – until 1 May", "valid - until 1 may"),
    ).toBe(true);
  });
  it("keeps at most two lines of context either side (minimised snippets)", () => {
    const page = "L1\nL2\nL3\nL4 before\nRenews on 1 May 2027.\nA1\nA2\nA3\nA4";
    const found = locateEvidence("Renews on 1 May 2027.", [page], null, false);
    expect(found).toMatchObject({
      before: "…L3\nL4 before\n",
      match: "Renews on 1 May 2027.",
      after: "\nA1\nA2…",
      page: null,
    });
  });
  it("rejects fabricated, paraphrased or trivially short evidence", () => {
    expect(
      locateEvidence(
        "Your hosting plan renews on 21 October 2030.",
        pages,
        null,
        true,
      ),
    ).toBeNull();
    expect(
      locateEvidence("The plan will renew on 21 Oct 2027", pages, null, true),
    ).toBeNull();
    expect(locateEvidence("2027", pages, null, true)).toBeNull();
  });
  it("redacts e-mail addresses and long digit runs in stored context", () => {
    expect(redactSnippet("Write to billing@example.invalid today")).toBe(
      "Write to [email removed] today",
    );
    expect(redactSnippet("Call 0803 123 4567 now")).toBe(
      "Call •••• ••• 4567 now",
    );
    expect(redactSnippet("Renews on 21/10/2027")).toBe("Renews on 21/10/2027");
    expect(redactSnippet("Call 0803 123 4567", false)).toBe(
      "Call 0803 123 4567",
    );
  });
});
