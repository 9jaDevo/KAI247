// Optional browser QA: install Playwright separately or provide its module directory.
// No credentials, provider requests or persistent business mutations are used.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.KAI247_PLAYWRIGHT_MODULE || "playwright",
);
const base = process.env.KAI247_PREVIEW_URL || "http://127.0.0.1:3000";
const output = "docs/evidence/p1";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
});
const page = await context.newPage();
const report = {
  timestampUtc: new Date().toISOString(),
  base,
  outcome: "running",
  routes: [],
  checks: [],
  screenshots: [],
  errors: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
async function visit(path) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.getByRole("heading").first().waitFor();
}
async function capture(name, fullPage = false) {
  const path = `${output}/${name}.png`;
  await page.screenshot({ path, fullPage, animations: "disabled" });
  report.screenshots.push(path);
}
try {
  await visit("/app/renewals/sample-hosting");
  assert.equal(new URL(page.url()).pathname, "/login");
  assert(await page.getByLabel("Email address", { exact: true }).isDisabled());
  report.checks.push(
    "Direct workspace visit redirected to login; owner sign-in fields disabled.",
  );
  await page
    .getByRole("button", { name: "Explore synthetic demo", exact: true })
    .click();
  await page.waitForURL(`${base}/app`);
  await page.getByText("Synthetic demo", { exact: true }).waitFor();
  const previewCookie = (await context.cookies()).find(
    (cookie) => cookie.name === "kai247_preview",
  );
  assert(previewCookie?.httpOnly && previewCookie.sameSite === "Lax");
  report.checks.push(
    "Explicit preview entry sets HttpOnly/SameSite public-fixture marker; no credentials supplied.",
  );
  const routes = [
    "/",
    "/login",
    "/app",
    "/app/renewals",
    "/app/renewals/new",
    "/app/renewals/sample-hosting",
    "/app/renewals/sample-hosting/edit",
    "/app/import",
    "/app/import/review",
    "/app/activity",
    "/app/settings",
  ];
  for (const width of [360, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      await visit(route);
      const metrics = await page.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
      }));
      report.routes.push({
        route,
        width,
        ...metrics,
        heading: await page.locator("h1").first().innerText(),
      });
      assert(
        metrics.document <= metrics.viewport + 1,
        `Page overflow: ${route} at ${width}px (${metrics.document}px)`,
      );
      if (["/", "/app", "/app/import/review"].includes(route))
        await capture(
          `${route === "/" ? "landing" : route === "/app" ? "dashboard" : "review"}-${width}`,
        );
      if (
        width === 360 &&
        [
          "/login",
          "/app/renewals/new",
          "/app/activity",
          "/app/settings",
        ].includes(route)
      )
        await capture(
          `${route.split("/").filter(Boolean).join("-")}-360`,
          true,
        );
      if (width === 1280 && ["/", "/app"].includes(route))
        await capture(
          `${route === "/" ? "landing" : "dashboard"}-full-1280`,
          true,
        );
    }
  }
  report.checks.push(
    "All 11 routes inspected at 360/768/1280px; zero document-level horizontal overflow. Activity table has intentional contained horizontal scrolling.",
  );
  await page.setViewportSize({ width: 360, height: 900 });
  await visit("/app");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await capture("navigation-360");
  assert.equal(
    await page
      .getByRole("button", { name: "Close navigation" })
      .getAttribute("aria-expanded"),
    "true",
  );
  await page.getByRole("link", { name: "Renewals", exact: true }).click();
  await page.waitForURL(`${base}/app/renewals`);
  assert.equal(
    await page
      .getByRole("button", { name: "Open navigation" })
      .getAttribute("aria-expanded"),
    "false",
  );
  await page.getByLabel("Search renewals").fill("not-a-record");
  await page.getByRole("heading", { name: "No matching renewals" }).waitFor();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("Category", { exact: true }).selectOption("vehicle");
  assert.equal(
    await page
      .getByRole("link", { name: "Delivery van insurance", exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page
      .getByRole("link", { name: "Website hosting", exact: true })
      .count(),
    0,
  );
  await page.getByLabel("Category", { exact: true }).selectOption("all");
  await page.getByLabel("Status", { exact: true }).selectOption("Renewed");
  assert.equal(
    await page
      .getByRole("link", { name: "Equipment service agreement", exact: true })
      .count(),
    1,
  );
  await page.getByText("Explore preview states", { exact: true }).click();
  await page.getByLabel("Illustrative screen state").selectOption("loading");
  assert(await page.getByRole("status").isVisible());
  await page.getByLabel("Illustrative screen state").selectOption("error");
  await page.getByRole("button", { name: "Return to sample view" }).click();
  await page.getByLabel("Illustrative screen state").selectOption("empty");
  await page.getByRole("heading", { name: "No renewals yet" }).waitFor();
  report.checks.push(
    "Mobile navigation expands/collapses; search, category, status, clear filters, loading, error recovery and empty states exercised.",
  );

  await visit("/app/renewals/new");
  await page.getByLabel("Renewal title *", { exact: true }).fill("   ");
  await page.getByLabel("Due date *", { exact: true }).fill("2027-01-01");
  await page.getByRole("button", { name: "Preview save", exact: true }).click();
  await page.locator("#title-error").waitFor();
  await page
    .getByLabel("Renewal title *", { exact: true })
    .fill("Synthetic test renewal");
  await page.getByRole("button", { name: "Preview save", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    assert(
      await page.evaluate(
        () =>
          !!document
            .querySelector("dialog[open]")
            ?.contains(document.activeElement),
      ),
    );
  }
  await capture("dialog-360");
  await page.keyboard.press("Escape");
  assert(!(await page.getByRole("dialog").isVisible()));
  assert(
    await page
      .getByRole("button", { name: "Preview save", exact: true })
      .evaluate((element) => element === document.activeElement),
  );
  await page.getByRole("button", { name: "Preview save", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm preview", exact: true })
    .click();
  await page.getByRole("status").waitFor();
  assert(
    (await page.getByRole("status").innerText()).includes(
      "Nothing saved or scheduled",
    ),
  );
  report.checks.push(
    "Whitespace title validation, native dialog focus containment, Escape dismissal, focus restoration and truthful preview toast passed.",
  );

  await visit("/app/renewals/sample-hosting");
  await page.getByRole("button", { name: "Preview mark renewed" }).click();
  await page.getByLabel("Replacement due date *").fill("2027-10-21");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm preview" })
    .click();
  await page.getByRole("status").waitFor();
  await page.reload({ waitUntil: "networkidle" });
  assert(await page.getByText("21 Oct 2026", { exact: true }).isVisible());
  await visit("/app/renewals/sample-hosting/edit");
  assert.equal(
    await page.getByLabel("Renewal title *").inputValue(),
    "Website hosting",
  );
  report.checks.push(
    "Detail renewal dialog and prefilled edit screen passed; reload proves fixture remained unchanged.",
  );

  await visit("/app/import");
  await page
    .getByLabel("Choose a synthetic file (UI check only)")
    .setInputFiles({
      name: "synthetic.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("synthetic"),
    });
  await page.locator("#file-error").waitFor();
  assert(
    (await page.locator("#file-error").innerText()).includes(
      "Unsupported file",
    ),
  );
  await page
    .getByLabel("Choose a synthetic file (UI check only)")
    .setInputFiles({
      name: "synthetic.txt",
      mimeType: "text/plain",
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
  assert(
    (await page.locator("#file-error").innerText()).includes("exceeds 5 MB"),
  );
  await page
    .getByLabel("Choose a synthetic file (UI check only)")
    .setInputFiles({
      name: "synthetic.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Synthetic invoice"),
    });
  assert(
    await page
      .getByRole("button", { name: "Extract with Gemma · unavailable" })
      .isDisabled(),
  );
  await page.getByRole("link", { name: "Review a synthetic sample" }).click();
  await page.waitForURL(`${base}/app/import/review`);
  assert(
    await page
      .getByRole("button", { name: "Approve & Save · preview" })
      .isDisabled(),
  );
  await page.getByLabel("I checked the source and confirmed the date.").check();
  await page.getByRole("button", { name: "Approve & Save · preview" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm preview", exact: true })
    .click();
  await page.getByRole("status").waitFor();
  await page.getByText("Explore review states", { exact: true }).click();
  for (const state of [
    "ambiguous",
    "missing",
    "malformed",
    "unsupported",
    "loading",
    "error",
  ]) {
    await page.getByLabel("Illustrative extraction state").selectOption(state);
    if (state === "ambiguous") {
      assert.equal(
        await page.getByLabel("Confirmed due date *").inputValue(),
        "",
      );
      assert(
        await page
          .getByRole("button", { name: "Approve & Save · preview" })
          .isDisabled(),
      );
    } else
      assert.equal(
        await page
          .getByRole("button", { name: "Approve & Save · preview" })
          .count(),
        0,
      );
  }
  report.checks.push(
    "File type/size UI validation and unavailable extraction; explicit review confirmation; ambiguous/missing/malformed/unsupported/loading/AI failure states passed. No file content was parsed or sent to providers.",
  );

  await visit("/app/settings");
  assert(
    await page
      .getByRole("button", { name: "Send test email · unavailable" })
      .isDisabled(),
  );
  await page.getByRole("button", { name: "Preview preferences" }).click();
  await page.getByRole("status").waitFor();
  assert(
    (await page.getByRole("status").innerText()).includes(
      "Nothing saved or activated",
    ),
  );
  await visit("/app/renewals/unknown-sample");
  await page
    .getByRole("heading", { name: "Sample renewal not found" })
    .waitFor();
  await visit("/app");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: "Leave preview" }).click();
  await page.waitForURL(`${base}/login`);
  await visit("/app/settings");
  assert.equal(new URL(page.url()).pathname, "/login");
  report.checks.push(
    "Settings preview toast, disabled email send, missing-record fallback and leaving preview/re-entry guard passed.",
  );

  await visit("/");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent),
    "Skip to content",
  );
  assert.equal(
    await page
      .locator("a.skip-link")
      .evaluate((element) => getComputedStyle(element).outlineStyle),
    "solid",
  );
  report.checks.push(
    "Keyboard-first skip link and visible focus outline passed.",
  );
  assert.equal(
    report.errors.length,
    0,
    `Browser errors: ${report.errors.join("; ")}`,
  );
  report.outcome = "pass";
} catch (error) {
  report.outcome = "fail";
  report.failure = error.stack || String(error);
  await capture("failure", true);
  process.exitCode = 1;
} finally {
  await writeFile(
    `${output}/browser-report.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        outcome: report.outcome,
        routesChecked: report.routes.length,
        checks: report.checks.length,
        errors: report.errors,
        failure: report.failure,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
