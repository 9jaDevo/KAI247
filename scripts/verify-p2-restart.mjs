import { readFile, writeFile } from "node:fs/promises";
if (process.env.SEED_OWNER_MODE !== "synthetic")
  throw new Error(
    "Restart HTTP verification requires the synthetic local sandbox.",
  );
const base = process.env.APP_URL;
try {
  const proof = JSON.parse(
    await readFile("docs/evidence/p2/browser-report.json", "utf8"),
  );
  const login = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({
      email: process.env.SEED_OWNER_EMAIL,
      password: process.env.SEED_OWNER_PASSWORD,
    }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0];
  if (login.status !== 200 || !cookie) throw new Error("Login unavailable");
  const response = await fetch(`${base}/api/renewals/${proof.record.id}`, {
    headers: { Cookie: cookie },
  });
  const result = await response.json();
  const pass =
    response.status === 200 &&
    result.data.renewal.dueDate === proof.record.dueDate &&
    result.data.renewal.version === proof.record.version;
  await writeFile(
    "docs/evidence/p2/restart-http.json",
    JSON.stringify(
      {
        timestampUtc: new Date().toISOString(),
        loginStatus: login.status,
        readStatus: response.status,
        recordPersistedAfterRestart: pass,
      },
      null,
      2,
    ),
  );
  await fetch(`${base}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: base,
      Cookie: cookie,
    },
    body: "{}",
  });
  if (!pass) throw new Error("Record changed");
  console.log(
    "Real HTTP login and record read passed after the local MongoDB process restart. Session revoked afterward.",
  );
} catch {
  console.error("Restart HTTP verification failed. Details redacted.");
  process.exitCode = 1;
}
