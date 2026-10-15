import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StoredRenewalTable } from "../../src/components/stored-renewal-table";
import { validateEnv } from "../../src/lib/security/env.ts";
import type { RenewalView } from "../../src/types/domain";
it("renders untrusted owner strings as text, not executable markup", () => {
  const item: RenewalView = {
    id: "000000000000000000000001",
    title: "<script>alert(1)</script>",
    provider: "<img src=x onerror=alert(1)>",
    category: "vehicle",
    dueDate: "2027-01-01",
    timezone: "Africa/Lagos",
    dateType: "expiry",
    dateSource: "manual",
    status: "active",
    createdAt: "2026-10-14T00:00:00Z",
    updatedAt: "2026-10-14T00:00:00Z",
    version: 1,
    displayStatus: "Upcoming",
  };
  const markup = renderToStaticMarkup(<StoredRenewalTable items={[item]} />);
  expect(markup).toContain("&lt;script&gt;");
  expect(markup).not.toContain("<script>");
  expect(markup).not.toContain("<img src=x");
});
it("rejects development-only database configuration in production", () => {
  expect(() =>
    validateEnv(
      {
        NODE_ENV: "production",
        MONGODB_URI: "mongodb://127.0.0.1:27018",
        MONGODB_DB: "local",
      },
      ["db"],
    ),
  ).toThrow("Atlas");
});
