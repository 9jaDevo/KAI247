import { describe, it, expect } from "vitest";
import dataset from "../fixtures/benchmark/p7/dataset.json";
import {
  score,
  regexBaseline,
  latencySummary,
  csvCell,
  fields,
} from "../../scripts/benchmark/p7-core.mjs";
describe("P7 evaluation integrity, no model transport", () => {
  it("has 16 labeled synthetic texts with source-backed reference anchors", () => {
    expect(dataset.documents).toHaveLength(16);
    expect(new Set(dataset.documents.map((d) => d.id)).size).toBe(16);
    for (const d of dataset.documents) {
      expect(d.text).toContain("SYNTHETIC BENCHMARK");
      for (const anchor of d.reference.evidenceAnchors)
        expect(d.text).toContain(anchor);
    }
  });
  it("penalizes inference failure even when the reference has missing fields", () => {
    expect(Object.values(score(dataset.documents[7], null))).toEqual(
      fields.map(() => false),
    );
  });
  it("requires exact date semantics and source evidence, not a plausible quoted date", () => {
    const d = dataset.documents[0];
    const actual = regexBaseline(d.text);
    expect(Object.values(score(d, actual)).every(Boolean)).toBe(true);
    expect(
      score(d, { ...actual, evidence: "Hosting renews on 1 January 2099" })
        .evidence,
    ).toBe(false);
    expect(score(d, { ...actual, dateType: "payment" }).dateType).toBe(false);
    expect(score(d, { ...actual, amountMinor: 1 }).amountMinor).toBe(false);
  });
  it("retains an honest weak baseline failure on issue dates and decoy amounts", () => {
    expect(
      score(dataset.documents[1], regexBaseline(dataset.documents[1].text))
        .date,
    ).toBe(false);
    expect(
      score(dataset.documents[12], regexBaseline(dataset.documents[12].text))
        .amountMinor,
    ).toBe(false);
  });
  it("reports median but withholds p95 below twenty observations", () => {
    expect(latencySummary([4, 1, 3, 2])).toMatchObject({
      n: 4,
      medianMs: 2.5,
      p95Ms: null,
    });
    expect(
      latencySummary(Array.from({ length: 20 }, (_, i) => i + 1)).p95Ms,
    ).toBe(19);
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
  });
});
