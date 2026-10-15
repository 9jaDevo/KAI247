import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  filterPreviewRenewals,
  previewRenewals,
  formatPreviewAmount,
  formatPreviewDate,
} from "../../src/lib/renewals/preview-fixtures";
import { RenewalTable } from "../../src/components/renewal-table";
import { LoadingState, EmptyState, Toast } from "../../src/components/ui";

describe("synthetic preview UI", () => {
  it("combines search, category and status without mutating fixtures", () => {
    const original = JSON.stringify(previewRenewals);
    expect(
      filterPreviewRenewals(
        "  EXAMPLE  ",
        "digital_infrastructure",
        "Due soon",
      ),
    ).toHaveLength(2);
    expect(filterPreviewRenewals("hosting", "vehicle", "all")).toHaveLength(0);
    expect(JSON.stringify(previewRenewals)).toBe(original);
  });
  it("returns empty results for a nonmatching search", () => {
    expect(filterPreviewRenewals("not-a-record", "all", "all")).toEqual([]);
  });
  it("formats fixture amounts from minor units and date-only values consistently", () => {
    expect(formatPreviewAmount(previewRenewals[0])).toContain("85,000");
    expect(formatPreviewDate("2026-10-21")).toBe("21 Oct 2026");
  });
  it("renders source labels and status text, not just status colors", () => {
    const markup = renderToStaticMarkup(
      <RenewalTable items={previewRenewals} />,
    );
    expect(markup).toContain("Synthetic example records");
    expect(markup).toContain("Document confirmed (sample)");
    expect(markup).toContain('scope="col"');
    for (const status of ["Due soon", "Overdue", "Upcoming", "Renewed"])
      expect(markup).toContain(status);
  });
  it("announces loading and notices with readable empty-state guidance", () => {
    expect(renderToStaticMarkup(<LoadingState />)).toContain('role="status"');
    expect(
      renderToStaticMarkup(
        <EmptyState
          title="No renewals yet"
          description="Add your first confirmed date."
        />,
      ),
    ).toContain("Add your first confirmed date.");
    expect(
      renderToStaticMarkup(
        <Toast message="Nothing saved." onDismiss={() => {}} />,
      ),
    ).toContain('aria-live="polite"');
  });
});
