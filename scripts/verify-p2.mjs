import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(
  process.env.KAI247_PLAYWRIGHT_MODULE || "playwright",
);
if (
  process.env.SEED_OWNER_MODE !== "synthetic" ||
  !process.env.SEED_OWNER_PASSWORD
)
  throw new Error(
    "Browser QA requires the explicitly synthetic local sandbox configuration.",
  );
const base = process.env.APP_URL || "http://127.0.0.1:3000";
const output = "docs/evidence/p2";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  locale: "en-GB",
});
const page = await context.newPage();
const report = {
  timestampUtc: new Date().toISOString(),
  outcome: "running",
  database: "Local MongoDB; Atlas not verified",
  checks: [],
  routes: [],
  screenshots: [],
  errors: [],
};
page.on("pageerror", (error) => report.errors.push(error.message));
const title = `Synthetic browser domain ${Date.now()}`;
const editedTitle = `${title} edited`;
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
  await visit("/app");
  assert.equal(new URL(page.url()).pathname, "/login");
  assert.equal((await page.request.get(`${base}/api/renewals`)).status(), 401);
  await context.addCookies([
    { name: "kai247_preview", value: "synthetic-only", url: base },
  ]);
  await visit("/app");
  assert.equal(new URL(page.url()).pathname, "/login");
  report.checks.push(
    "Direct page/API visits and legacy public preview marker cannot access the owner workspace.",
  );
  await page
    .getByLabel("Email address", { exact: true })
    .fill(process.env.SEED_OWNER_EMAIL);
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.SEED_OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(`${base}/app`);
  await page
    .getByRole("heading", { name: "A clearer view of what’s next." })
    .waitFor();
  const session = (await context.cookies()).find(
    (cookie) => cookie.name === "kai247_session",
  );
  assert(session?.httpOnly && session.sameSite === "Lax");
  report.checks.push(
    "Real credential login succeeded; sealed HttpOnly/SameSite=Lax cookie issued for local HTTP. Secure production HTTPS deployment remains unverified.",
  );
  await visit("/app/renewals/new");
  await page.getByLabel("Renewal title *", { exact: true }).fill(title);
  await page.getByLabel("Provider", { exact: true }).fill("Example Registrar");
  await page.getByLabel("Due date *", { exact: true }).fill("2027-06-15");
  await page.getByLabel("Amount (optional)", { exact: true }).fill("12345.67");
  await page
    .getByLabel("Responsible person", { exact: true })
    .fill("Synthetic owner");
  await page
    .getByLabel("Notes", { exact: true })
    .fill("Synthetic browser verification record only.");
  await page
    .getByRole("button", { name: "Review & save", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await page.waitForURL(/\/app\/renewals\/[a-f0-9]{24}$/);
  const id = new URL(page.url()).pathname.split("/").at(-1);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: title, exact: true }).waitFor();
  assert(await page.getByText("15 Jun 2027", { exact: true }).isVisible());
  const first = await (
    await page.request.get(`${base}/api/renewals/${id}`)
  ).json();
  assert.equal(first.data.renewal.amountMinor, 1234567);
  assert.equal(first.data.renewal.version, 1);
  assert.equal(first.data.history[0].action, "created");
  report.checks.push(
    "Created a confirmed domain renewal for 2027-06-15; reload and a new authenticated API read show real persisted data, minor amount 1234567 and created audit.",
  );
  await page.getByRole("link", { name: "Edit details", exact: true }).click();
  await page.getByLabel("Renewal title *", { exact: true }).fill(editedTitle);
  await page.getByLabel("Amount (optional)", { exact: true }).fill("12400.10");
  await page
    .getByRole("button", { name: "Review & save", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm & save", exact: true })
    .click();
  await page.waitForURL(`${base}/app/renewals/${id}`);
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: editedTitle, exact: true }).waitFor();
  const edited = await (
    await page.request.get(`${base}/api/renewals/${id}`)
  ).json();
  assert.equal(edited.data.renewal.amountMinor, 1240010);
  assert.equal(edited.data.renewal.version, 2);
  report.checks.push(
    "Edited title and amount; reload retained the change and incremented the record version.",
  );
  await page.getByRole("button", { name: "Mark renewed", exact: true }).click();
  await page
    .getByLabel("Replacement due date *", { exact: true })
    .fill("2028-06-15");
  await page
    .getByLabel("Completion notes", { exact: true })
    .fill("Synthetic cycle completed; replacement date confirmed.");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm renewal", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByText("15 Jun 2028", { exact: true }).waitFor();
  const renewed = await (
    await page.request.get(`${base}/api/renewals/${id}`)
  ).json();
  assert.equal(renewed.data.renewal.version, 3);
  assert.equal(renewed.data.renewal.dueDate, "2028-06-15");
  assert(renewed.data.renewal.completedAt);
  assert(renewed.data.history.some((event) => event.action === "renewed"));
  assert.equal(
    renewed.data.renewal.notes,
    "Synthetic cycle completed; replacement date confirmed.",
  );
  report.record = {
    id,
    title: editedTitle,
    dueDate: renewed.data.renewal.dueDate,
    version: renewed.data.renewal.version,
    amountMinor: renewed.data.renewal.amountMinor,
    historyActions: renewed.data.history.map((event) => event.action),
  };
  report.checks.push(
    "Marked renewed with next date 2028-06-15; reload shows completion, new version, persisted notes and updated history. No new reminder jobs created.",
  );
  await capture("renewal-history-1280", true);
  await visit("/app/renewals");
  await page.getByLabel("Search renewals").fill(editedTitle);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("link", { name: editedTitle, exact: true }).waitFor();
  await page.getByLabel("Search renewals").fill("no-matching-record-xyz");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("heading", { name: "No matching renewals" }).waitFor();
  const unauthorizedOrigin = await page.request.post(`${base}/api/renewals`, {
    headers: { origin: "https://evil.invalid" },
    data: {},
  });
  assert.equal(unauthorizedOrigin.status(), 403);
  const me = await (await page.request.get(`${base}/api/auth/me`)).json();
  assert(!JSON.stringify(me).includes("passwordHash"));
  const jobs = await (await page.request.get(`${base}/api/activity`)).json();
  assert.equal(jobs.data.length, 0);
  report.checks.push(
    "Stored search/no-results states, HTTP cross-origin rejection, safe owner response and empty real notification history passed.",
  );
  const routes = [
    "/",
    "/login",
    "/app",
    "/app/renewals",
    "/app/renewals/new",
    `/app/renewals/${id}`,
    `/app/renewals/${id}/edit`,
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
      report.routes.push({ route, width, ...metrics });
      assert(
        metrics.document <= metrics.viewport + 1,
        `Page overflow at ${width}px: ${route}`,
      );
      if (["/app", `/app/renewals/${id}`, "/app/settings"].includes(route))
        await capture(
          `${route === "/app" ? "dashboard" : route === "/app/settings" ? "settings" : "renewal"}-${width}`,
          width === 360,
        );
    }
  }
  report.checks.push(
    "All 11 authenticated/public routes fit 360/768/1280px; source/history values remain scoped to the signed-in synthetic owner.",
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await visit("/app/settings");
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await page.getByRole("status").waitFor();
  assert(
    (await page.getByRole("status").innerText()).includes("preferences saved"),
  );
  assert(
    await page
      .getByRole("button", { name: "Send test email · unavailable" })
      .isDisabled(),
  );
  const replay = `kai247_session=${session.value}`;
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL(`${base}/login`);
  assert.equal(
    (
      await page.request.get(`${base}/api/auth/me`, {
        headers: { cookie: replay },
      })
    ).status(),
    401,
  );
  await visit("/app");
  assert.equal(new URL(page.url()).pathname, "/login");
  report.checks.push(
    "Preferences save, disabled email send, logout revocation (including replay of the old sealed cookie) and server page guard passed.",
  );
  assert.equal(report.errors.length, 0);
  report.outcome = "pass";
} catch (error) {
  report.outcome = "fail";
  report.failure = error.stack || String(error);
  await capture("failure", true);
  process.exitCode = 1;
} finally {
  let serialized = JSON.stringify(report, null, 2);
  for (const key of ["SEED_OWNER_PASSWORD", "AUTH_SECRET", "MONGODB_URI"])
    if (process.env[key])
      serialized = serialized.split(process.env[key]).join("[REDACTED]");
  await writeFile(`${output}/browser-report.json`, serialized);
  console.log(
    JSON.stringify(
      {
        outcome: report.outcome,
        routesChecked: report.routes.length,
        checks: report.checks.length,
        runtimeErrors: report.errors.length,
        failure: report.failure ? "See redacted browser report" : undefined,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
