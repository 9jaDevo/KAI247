// Controlled HTTPS acceptance: a NEW synthetic .invalid owner only. No email sent.
// Requires private .env Atlas credentials for the deployed app database.
import { parseEnv } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";

Object.assign(process.env, parseEnv(await readFile(".env", "utf8")), {
  NODE_ENV: "production",
  SENTRY_DSN: "",
});
const base = "https://kai247.onrender.com";
const { provisionOwner } = await import("../src/lib/auth/provision.ts");
const { closeDatabase } = await import("../src/lib/db/client.ts");
const credentials = {
  email: `p8-${randomBytes(6).toString("hex")}@example.invalid`,
  password: randomBytes(24).toString("base64url"),
};
await mkdir(".local", { recursive: true });
await mkdir("docs/evidence/p8", { recursive: true });
let cookie = "";
let stage = "health";
const report = {
  checkedUtc: new Date().toISOString(),
  target: base,
  scope:
    "New isolated SYNTHETIC .invalid owner; actual deployed HTTPS API and Atlas. No real email, no other owner records.",
  checks: [],
  realEmailSent: false,
};
async function call(path, method = "GET", body, origin = base) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(method !== "GET" ? { origin } : {}),
      ...(body !== undefined && !(body instanceof FormData)
        ? { "content-type": "application/json" }
        : {}),
    },
    ...(body === undefined
      ? {}
      : {
          body: body instanceof FormData ? body : JSON.stringify(body),
        }),
    redirect: "manual",
    signal: AbortSignal.timeout(150000),
  });
  return { response, ...(await response.json()) };
}
try {
  assert.equal((await call("/api/health")).response.status, 200);
  assert.equal((await call("/api/renewals")).response.status, 401);
  report.checks.push(
    "Safe HTTPS readiness 200 and unauthenticated renewals 401",
  );
  stage = "provision-and-login";
  await provisionOwner({
    ...credentials,
    displayName: "Synthetic P8 owner",
    organizationName: "SYNTHETIC P8 submission smoke",
    isDemo: true,
  });
  await writeFile(
    ".local/p8-live-private.json",
    JSON.stringify({ base, ...credentials }),
  );
  const login = await call("/api/auth/login", "POST", credentials);
  assert.equal(login.response.status, 200);
  const sealed = login.response.headers.get("set-cookie");
  assert.match(sealed, /; Secure/);
  assert.match(sealed, /HttpOnly/);
  assert.match(sealed, /SameSite=Lax/);
  cookie = sealed.split(";")[0];
  report.checks.push("Owner login and Secure/HttpOnly/SameSite session cookie");
  stage = "manual-crud";
  const input = {
    title: "SYNTHETIC P8 domain",
    category: "digital_infrastructure",
    dueDate: "2028-06-15",
    dateType: "renewal",
    timezone: "Africa/Lagos",
  };
  assert.equal(
    (
      await call(
        "/api/renewals",
        "POST",
        input,
        "https://attacker.example.invalid",
      )
    ).response.status,
    403,
  );
  const created = await call("/api/renewals", "POST", input);
  assert.equal(created.response.status, 201);
  report.manualId = created.data.id;
  assert.equal(
    (
      await call(`/api/renewals/${report.manualId}`, "PATCH", {
        ...input,
        title: "SYNTHETIC P8 edited domain",
        version: 1,
      })
    ).response.status,
    200,
  );
  assert.equal(
    (
      await call(`/api/renewals/${report.manualId}/renew`, "POST", {
        version: 2,
        dueDate: "2029-06-15",
        notes: "Synthetic P8 acceptance; no real payment",
      })
    ).response.status,
    200,
  );
  const fresh = (await call(`/api/renewals/${report.manualId}`)).data;
  assert.equal(fresh.renewal.version, 3);
  assert.equal(fresh.renewal.dueDate, "2029-06-15");
  assert(fresh.history.some((h) => h.action === "renewed"));
  report.checks.push(
    "Origin rejection and actual create/edit/renew/fresh read/history persistence",
  );
  stage = "real-gemma";
  const form = new FormData();
  form.append(
    "file",
    new File(
      [await readFile("tests/fixtures/benchmark/p7/walkthrough-hosting.txt")],
      "SYNTHETIC-p8-hosting.txt",
      { type: "text/plain" },
    ),
  );
  const upload = await call("/api/extractions", "POST", form);
  report.uploadStatus = upload.response.status;
  if (upload.response.status !== 201) {
    report.extractionErrorCode = upload.error?.code;
    throw new Error("Extraction failed safely");
  }
  const x = upload.data;
  assert.match(x.modelId, /^gemma-/);
  assert.equal(x.validationStatus, "pending_review");
  assert.equal((await call("/api/renewals")).data.length, 1);
  report.extraction = {
    modelId: x.modelId,
    modelMs: x.elapsedMs,
    status: x.validationStatus,
    evidenceMatched: !!x.candidateFields.date.evidence?.match,
  };
  stage = "explicit-owner-approval";
  const confirm = await call(`/api/extractions/${x.id}/confirm`, "POST", {
    ...input,
    title: "SYNTHETIC P8 approved hosting",
    dueDate: "2027-10-21",
    evidenceChecked: true,
    acknowledgeDateDiffers: true,
  });
  assert.equal(confirm.response.status, 201);
  const id = confirm.data.renewal.id;
  report.documentRenewalId = id;
  assert.equal(
    (await call(`/api/renewals/${id}`)).data.renewal.dateSource,
    "document_confirmed",
  );
  assert.equal(
    (
      await call(`/api/renewals/${id}/renew`, "POST", {
        version: 1,
        dueDate: "2028-10-21",
        notes: "Synthetic next cycle",
      })
    ).response.status,
    200,
  );
  const renewed = (await call(`/api/renewals/${id}`)).data;
  report.replacement = {
    dateSource: renewed.renewal.dateSource,
    version: renewed.renewal.version,
    dueDate: renewed.renewal.dueDate,
  };
  assert.equal(renewed.renewal.dateSource, "manual");
  assert.equal(renewed.renewal.dueDate, "2028-10-21");
  report.checks.push(
    "Real Gemma pending candidate, no automatic renewal, owner approval and P7 replacement provenance fix deployed",
  );
  stage = "settings";
  const settings = await call("/api/settings");
  report.notificationStatus = {
    emailOptIn: settings.data.organization.emailOptIn,
    verified: !!settings.data.organization.verifiedNotificationEmail,
    providerConfiguration: "Not exposed by this API; not inferred",
  };
  report.outcome = "PASS_CORE_EMAIL_AND_CRON_NOT_TESTED";
} catch {
  report.outcome = "FAIL";
  report.failedStage = stage;
  process.exitCode = 1;
} finally {
  if (cookie) {
    try {
      await call("/api/auth/logout", "POST", {});
      report.logout = true;
    } catch {
      report.logout = false;
    }
  }
  await closeDatabase();
  await writeFile(
    "docs/evidence/p8/live-smoke.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report));
}
