// Local production bundle + isolated real Atlas + synthetic PDF and real Gemma.
// This is NOT a Render deployment or TLS browser proof. No emails are sent.
import { parseEnv } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
const configured = parseEnv(await readFile(".env", "utf8"));
const database = `kai247_p5_smoke_${randomBytes(6).toString("hex")}`;
const origin = "https://kai247-smoke.example.invalid";
const base = "http://127.0.0.1:3105";
const email = `p5-${randomBytes(6).toString("hex")}@example.invalid`;
const password = randomBytes(24).toString("base64url");
Object.assign(process.env, configured, {
  NODE_ENV: "production",
  APP_URL: origin,
  AUTH_SECRET: randomBytes(48).toString("base64url"),
  MONGODB_DB: database,
  PORT: "3105",
  EMAIL_API_KEY: "",
  EMAIL_FROM: "",
});
if (!process.env.MONGODB_URI?.includes(".mongodb.net"))
  throw new Error("Atlas configuration required.");
const { provisionOwner } = await import("../src/lib/auth/provision.ts");
const { closeDatabase } = await import("../src/lib/db/client.ts");
await mkdir("docs/evidence/p5", { recursive: true });
const report = {
  timestampUtc: new Date().toISOString(),
  scope:
    "LOCAL next start production bundle over loopback HTTP, synthetic account in isolated real Atlas; NOT deployed Render or TLS proof",
  database,
  checks: [],
  outcome: "running",
  realEmailSent: false,
};
let server;
let cookie = "";
let stage = "provision";
const api = async (path, method = "GET", body) => {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(method !== "GET" ? { origin } : {}),
      ...(body !== undefined && !(body instanceof FormData)
        ? { "content-type": "application/json" }
        : {}),
    },
    ...(body !== undefined
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
    signal: AbortSignal.timeout(150000),
    redirect: "manual",
  });
  const data = await response.json();
  return { response, ...data };
};
try {
  await provisionOwner({
    email,
    password,
    displayName: "Synthetic P5 owner",
    organizationName: "Synthetic P5 production-bundle smoke",
    isDemo: true,
  });
  server = spawn(process.execPath, ["scripts/start-production.mjs"], {
    env: { ...process.env },
    stdio: "ignore",
    windowsHide: true,
  });
  stage = "readiness";
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      if ((await api("/api/health")).response.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  assert(ready);
  report.checks.push(
    "Production startup binds configured PORT; public readiness pings real Atlas and returns no infrastructure details.",
  );
  assert.equal((await api("/api/auth/me")).response.status, 401);
  stage = "authentication";
  const login = await api("/api/auth/login", "POST", { email, password });
  assert.equal(login.response.status, 200);
  const sealed = login.response.headers.get("set-cookie");
  assert.match(sealed, /; Secure/);
  assert.match(sealed, /HttpOnly/);
  assert.match(sealed, /SameSite=Lax/);
  cookie = sealed.split(";")[0];
  report.checks.push(
    "Actual owner login; production Secure/HttpOnly/SameSite cookie flags; unauthenticated API rejected. Cookie replay is manual over loopback, not browser TLS evidence.",
  );
  stage = "manual-crud";
  const input = {
    title: "SYNTHETIC P5 domain",
    category: "digital_infrastructure",
    dueDate: "2028-06-15",
    dateType: "renewal",
    timezone: "Africa/Lagos",
  };
  const created = await api("/api/renewals", "POST", input);
  assert.equal(created.response.status, 201);
  const id = created.data.id;
  assert.equal(
    (await api(`/api/renewals/${id}`)).data.renewal.dueDate,
    input.dueDate,
  );
  const edited = await api(`/api/renewals/${id}`, "PATCH", {
    ...input,
    title: "SYNTHETIC P5 edited domain",
    version: 1,
  });
  assert.equal(edited.response.status, 200);
  const renewed = await api(`/api/renewals/${id}/renew`, "POST", {
    dueDate: "2029-06-15",
    version: 2,
    notes: "Synthetic production-bundle verification",
  });
  assert.equal(renewed.response.status, 200);
  const fresh = await api(`/api/renewals/${id}`);
  assert.equal(fresh.data.renewal.version, 3);
  assert.equal(fresh.data.renewal.dueDate, "2029-06-15");
  assert(fresh.data.history.some((h) => h.action === "renewed"));
  report.checks.push(
    "Authenticated manual create/read/edit/renew and fresh read/audit persist in isolated Atlas.",
  );
  stage = "real-gemma-pdf";
  const form = new FormData();
  form.append(
    "file",
    new File(
      [
        await readFile(
          "tests/fixtures/documents/hosting-invoice-two-dates.pdf",
        ),
      ],
      "hosting-invoice-two-dates.pdf",
      { type: "application/pdf" },
    ),
  );
  const upload = await api("/api/extractions", "POST", form);
  report.uploadStatus = upload.response.status;
  if (upload.response.status !== 201) {
    report.extractionErrorCode = upload.error?.code;
    throw new Error("Extraction unavailable");
  }
  const x = upload.data;
  assert.equal(x.validationStatus, "pending_review");
  assert.equal(x.textExtractionMethod, "pdf_text_layer");
  assert.match(x.modelId, /^gemma-/);
  assert(x.candidateFields.date.evidence?.match);
  report.extraction = {
    modelId: x.modelId,
    modelMs: x.elapsedMs,
    method: x.textExtractionMethod,
    status: x.validationStatus,
  };
  assert.equal((await api("/api/renewals")).data.length, 1);
  stage = "approve";
  const confirmed = await api(`/api/extractions/${x.id}/confirm`, "POST", {
    ...input,
    title: "SYNTHETIC P5 approved hosting",
    dueDate: "2027-10-21",
    evidenceChecked: true,
    acknowledgeDateDiffers: true,
  });
  assert.equal(confirmed.response.status, 201);
  assert.equal(
    (await api(`/api/renewals/${confirmed.data.renewal.id}`)).data.renewal
      .dueDate,
    "2027-10-21",
  );
  report.checks.push(
    "Built production PDF parser and REAL Gemma return a pending candidate; reference-labelled synthetic owner confirmation alone creates the second persisted renewal. No model-direct creation.",
  );
  report.email = {
    status: "BLOCKED",
    reason:
      "Provider key/sender absent and synthetic owner unverified; no send attempted",
  };
  report.outcome = "PASS_LOCAL_CORE";
} catch {
  report.outcome = "FAIL";
  report.failedStage = stage;
  process.exitCode = 1;
} finally {
  if (cookie) {
    try {
      await api("/api/auth/logout", "POST", {});
    } catch {}
  }
  if (server) {
    // Terminate only this script's known child PID, including its Next child.
    if (process.platform === "win32")
      await new Promise((resolve) => {
        const p = spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
          stdio: "ignore",
          windowsHide: true,
        });
        p.on("exit", resolve);
      });
    else server.kill("SIGTERM");
  }
  await closeDatabase();
  await writeFile(
    "docs/evidence/p5/production-local-report.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
