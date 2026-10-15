// Explicit synthetic Atlas persistence probe. Never sends email or reads production records.
import { parseEnv } from "node:util";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
const env = parseEnv(await readFile(".env", "utf8"));
process.env.MONGODB_URI = env.MONGODB_URI;
process.env.MONGODB_DB = `kai247_p4_evidence_${randomBytes(6).toString("hex")}`;
if (!process.env.MONGODB_URI?.includes(".mongodb.net"))
  throw new Error("Atlas configuration required.");
const { collections, getClient, ensureIndexes, closeDatabase } = await import(
  "../src/lib/db/client.ts"
);
const { planReminders } = await import("../src/lib/notifications/planner.ts");
const report = {
  timestampUtc: new Date().toISOString(),
  dataset:
    "SYNTHETIC isolated Atlas database; no production records queried; no mailbox verification or email delivery claimed",
  database: process.env.MONGODB_DB,
  checks: [],
};
try {
  await ensureIndexes();
  const c = await collections();
  const now = new Date();
  const id = new ObjectId();
  const org = new ObjectId();
  const dueDate = `${now.getUTCFullYear() + 1}-06-15`;
  const plans = planReminders(
    dueDate,
    "Africa/Lagos",
    [30, 7, 1, 0],
    "09:00",
    now,
  );
  await (
    await getClient()
  ).withSession((s) =>
    s.withTransaction(async () => {
      for (const p of plans)
        await c.reminderJobs.insertOne(
          {
            _id: new ObjectId(),
            organizationId: org,
            renewalId: id,
            renewalVersion: 1,
            channel: "email",
            offsetDays: p.offsetDays,
            scheduledForUtc: p.scheduledForUtc,
            nextAttemptAt: p.scheduledForUtc,
            idempotencyKey: `synthetic:${id}:${p.offsetDays}`,
            status: "pending",
            attemptCount: 0,
            createdAt: now,
            updatedAt: now,
          },
          { session: s },
        );
    }),
  );
  const jobs = await c.reminderJobs.find({ organizationId: org }).toArray();
  if (jobs.length !== 4) throw new Error("Persistence mismatch");
  report.checks.push(
    "Atlas transaction and four persisted planner jobs passed",
  );
  const one = jobs[0];
  let duplicate = false;
  try {
    await c.reminderJobs.insertOne({ ...one, _id: new ObjectId() });
  } catch (e) {
    duplicate = e.code === 11000;
  }
  if (!duplicate) throw new Error("Unique index missing");
  report.checks.push("Unique idempotency index rejects duplicate");
  await closeDatabase();
  const after = await (
    await collections()
  ).reminderJobs.countDocuments({ organizationId: org });
  if (after !== 4) throw new Error("Reconnect failed");
  report.checks.push("Fresh pooled connection reads persisted jobs");
  report.jobCount = after;
  report.outcome = "PASS";
} catch {
  report.outcome = "FAIL";
  process.exitCode = 1;
} finally {
  await closeDatabase();
  await mkdir("docs/evidence/p4", { recursive: true });
  await writeFile(
    "docs/evidence/p4/atlas-proof.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
