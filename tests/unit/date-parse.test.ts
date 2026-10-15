import { describe, expect, it } from "vitest";
import {
  detectDeclaredFormat,
  parseWrittenDate,
} from "../../src/lib/ai/date-parse.ts";

describe("deterministic written-date parsing", () => {
  it("reads unambiguous textual and ISO dates", () => {
    for (const [raw, iso] of [
      ["21 October 2027", "2027-10-21"],
      ["21st Oct 2027", "2027-10-21"],
      ["1 November 2026", "2026-11-01"],
      ["October 21, 2027", "2027-10-21"],
      ["Sept 3 2027", "2027-09-03"],
      ["Thursday, 21 October 2027", "2027-10-21"],
      ["2027-10-21", "2027-10-21"],
      ["21-Oct-2027", "2027-10-21"],
    ])
      expect(parseWrittenDate(raw)).toEqual({ kind: "exact", iso });
  });
  it("reads DD/MM when the day is above 12 and MM/DD when the month position cannot be a month", () => {
    expect(parseWrittenDate("14/10/2026")).toEqual({
      kind: "exact",
      iso: "2026-10-14",
    });
    expect(parseWrittenDate("10/14/2026")).toEqual({
      kind: "exact",
      iso: "2026-10-14",
    });
    expect(parseWrittenDate("05.05.2027")).toEqual({
      kind: "exact",
      iso: "2027-05-05",
    });
  });
  it("keeps DD/MM vs MM/DD ambiguity for human resolution", () => {
    expect(parseWrittenDate("03/04/2027")).toEqual({
      kind: "ambiguous",
      interpretations: ["2027-04-03", "2027-03-04"],
    });
  });
  it("resolves numeric dates only when the document declares its format", () => {
    expect(detectDeclaredFormat("All dates are DD/MM/YYYY.")).toBe("day_first");
    expect(detectDeclaredFormat("Format: MM-DD-YYYY")).toBe("month_first");
    expect(detectDeclaredFormat("DD/MM/YYYY or MM/DD/YYYY")).toBeNull();
    expect(parseWrittenDate("03/04/2027", "day_first")).toEqual({
      kind: "exact",
      iso: "2027-04-03",
    });
    expect(parseWrittenDate("03/04/2027", "month_first")).toEqual({
      kind: "exact",
      iso: "2027-03-04",
    });
  });
  it("rejects impossible, two-digit-year, relative and free-text dates", () => {
    for (const raw of [
      "31/02/2027",
      "29 February 2027",
      "13/13/2027",
      "03/04/27",
      "within 30 days",
      "end of next month",
      "Smarch 3 2027",
      "",
    ])
      expect(parseWrittenDate(raw)).toEqual({ kind: "invalid" });
    expect(parseWrittenDate("29 February 2028")).toEqual({
      kind: "exact",
      iso: "2028-02-29",
    });
  });
});
