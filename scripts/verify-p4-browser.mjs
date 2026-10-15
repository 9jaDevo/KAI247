// Real local UI, synthetic sandbox credentials; no simulated delivery claims.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.KAI247_PLAYWRIGHT_MODULE || "playwright",
);
if (process.env.SEED_OWNER_MODE !== "synthetic")
  throw new Error("Synthetic sandbox required");
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const page = await browser.newPage();
const base = process.env.APP_URL;
const out = "docs/evidence/p4";
await mkdir(out, { recursive: true });
const report = {
  timestampUtc: new Date().toISOString(),
  outcome: "running",
  checks: [],
  screenshots: [],
  runtimeErrors: 0,
};
page.on("pageerror", () => report.runtimeErrors++);
try {
  await page.goto(base + "/login");
  await page.getByLabel("Email address").fill(process.env.SEED_OWNER_EMAIL);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.SEED_OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/app");
  await page.goto(base + "/app/settings");
  await page
    .getByRole("heading", { name: "Verify and test your email" })
    .waitFor();
  assert(
    await page
      .getByRole("button", { name: "Email me a verification code" })
      .isDisabled(),
  );
  assert(
    await page
      .getByRole("button", { name: "Send TEST reminder to my verified email" })
      .isDisabled(),
  );
  await page
    .getByRole("button", { name: "View non-delivering preview" })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "NON-DELIVERING PREVIEW" })
    .waitFor();
  report.checks.push(
    "Real owner sign-in; provider unavailable; verification/test disabled; non-delivering preview visible.",
  );
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page
    .getByText("Preferences saved. Eligible reminder schedules updated.", {
      exact: true,
    })
    .waitFor();
  await page.reload();
  const jobs = await (await page.request.get(base + "/api/activity")).json();
  assert(jobs.success);
  report.checks.push(
    "Preferences save and reload; authenticated real activity API succeeds.",
  );
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["settings", "activity"]) {
      await page.goto(base + "/app/" + route);
      await page.getByRole("heading", { level: 1 }).waitFor();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert(!overflow, route + " overflow at " + width);
      const path = `${out}/${route}-${width}.png`;
      await page.screenshot({ path, fullPage: true });
      report.screenshots.push(path);
      report.checks.push(route + " no document overflow at " + width);
    }
  }
  assert.equal(report.runtimeErrors, 0);
  report.outcome = "PASS";
} catch {
  report.outcome = "FAIL";
  process.exitCode = 1;
} finally {
  await writeFile(
    out + "/browser-report.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
  await browser.close();
}
