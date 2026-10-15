import type { EmailTransport } from "../../src/lib/notifications/provider.ts";
import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { spawnSync } from "node:child_process";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import {
  collections,
  closeDatabase,
  getClient,
  ensureIndexes,
} from "../../src/lib/db/client.ts";
import { provisionOwner } from "../../src/lib/auth/provision.ts";
import {
  createRenewal,
  renewRenewal,
  archiveRenewal,
  updateSettings,
} from "../../src/lib/renewals/service.ts";
import { planInitialReminders } from "../../src/lib/notifications/jobs.ts";
import {
  claimJob,
  processClaim,
  processBatch,
  LEASE_MS,
} from "../../src/lib/notifications/worker.ts";
import {
  requestVerification,
  confirmVerification,
  sendTest,
  previewReminder,
} from "../../src/lib/notifications/service.ts";
import {
  verificationPost,
  testPost,
  previewGet,
} from "../../src/lib/notifications/routes.ts";
import { issueSession } from "../../src/lib/auth/session.ts";
import type { OwnerContext, Renewal } from "../../src/types/domain.ts";
let replica: MongoMemoryReplSet;
let ctx: OwnerContext;
let other: OwnerContext;
const now = new Date("2028-03-02T10:00:00Z");
const input = {
  title: "Synthetic P4 domain",
  category: "digital_infrastructure",
  dueDate: "2028-03-01",
  dateType: "renewal",
  timezone: "Africa/Lagos",
};
const accepted = vi.fn<EmailTransport>(async () => ({
  accepted: true as const,
  id: "synthetic-provider-id",
}));
async function refresh() {
  const c = await collections();
  ctx.organization = (await c.organizations.findOne({
    _id: ctx.organization._id,
  }))!;
}
async function record() {
  const v = await createRenewal(ctx, input);
  return (await (
    await collections()
  ).renewals.findOne({ _id: new ObjectId(v.id) }))!;
}
async function queue(item: Renewal) {
  return (await getClient()).withSession((s) =>
    s.withTransaction(() => planInitialReminders(ctx, item, s, now)),
  );
}
beforeAll(async () => {
  replica = await MongoMemoryReplSet.create({
    binary: { version: "8.2.6" },
    replSet: {
      count: 1,
      storageEngine: "wiredTiger",
      spawn: { windowsHide: true },
    },
  });
  process.env.MONGODB_URI = replica.getUri();
  process.env.MONGODB_DB = `p4_${randomBytes(6).toString("hex")}`;
  process.env.APP_URL = "http://localhost:3000";
  process.env.AUTH_SECRET = randomBytes(48).toString("base64url");
  ctx = await provisionOwner({
    email: "p4-owner@example.com",
    password: randomBytes(24).toString("hex"),
    displayName: "Synthetic P4 owner",
    organizationName: "Synthetic P4 fixture",
    isDemo: false,
  });
  other = await provisionOwner({
    email: "p4-other@example.com",
    password: randomBytes(24).toString("hex"),
    displayName: "Synthetic other owner",
    organizationName: "Synthetic other fixture",
    isDemo: false,
  });
  await ensureIndexes();
});
beforeEach(async () => {
  const c = await collections();
  await c.reminderJobs.deleteMany({});
  await c.renewals.deleteMany({});
  await c.rateLimits.deleteMany({});
  await c.emailVerifications.deleteMany({});
  await c.organizations.updateOne(
    { _id: ctx.organization._id },
    {
      $set: {
        emailOptIn: true,
        verifiedNotificationEmail: ctx.user.email,
        notificationRevision: 0,
        timezone: "Africa/Lagos",
        reminderOffsetsDays: [30, 7, 1, 0],
        reminderLocalTime: "09:00",
      },
    },
  );
  await refresh();
  accepted.mockClear();
});
afterAll(async () => {
  await closeDatabase();
  await replica?.stop();
});
describe("P4 real MongoDB reliability; all email transport is SYNTHETIC", () => {
  it("does not retry outside the provider idempotency horizon", async () => {
    await record();
    const job = (await claimJob(now))!;
    const after = new Date(now.getTime() + 21 * 3600000);
    expect(await claimJob(after)).toBeNull();
    expect(
      (await (await collections()).reminderJobs.findOne({ _id: job._id }))
        ?.lastErrorCode,
    ).toBe("RETRY_BUDGET_EXHAUSTED");
    await processClaim(job, accepted, after);
    expect(accepted).not.toHaveBeenCalled();
  });
  it("rejects expired mailbox proof even before TTL cleanup", async () => {
    let code = "";
    await requestVerification(ctx, async (msg) => {
      code = msg.text.split("\n\n")[2];
      return { accepted: true, id: "synthetic" };
    });
    await (
      await collections()
    ).emailVerifications.updateMany(
      { userId: ctx.user._id },
      { $set: { expiresAt: new Date(0) } },
    );
    await expect(confirmVerification(ctx, { code })).rejects.toMatchObject({
      code: "INVALID_VERIFICATION",
    });
  });
  it("records provider outcome if cancellation wins during HTTP without reactivating", async () => {
    await record();
    const job = (await claimJob(now))!;
    await processClaim(
      job,
      async () => {
        await (
          await collections()
        ).reminderJobs.updateOne(
          { _id: job._id },
          { $set: { status: "cancelled" } },
        );
        return { accepted: true, id: "synthetic-raced" };
      },
      now,
    );
    const saved = await (
      await collections()
    ).reminderJobs.findOne({ _id: job._id });
    expect(saved?.status).toBe("cancelled");
    expect(saved?.attempts?.at(-1)?.outcome).toBe(
      "provider_accepted_after_invalidation",
    );
  });
  it("recovers claim persisted by a separate worker process that exits before send", async () => {
    await record();
    const script = `import {claimJob} from './src/lib/notifications/worker.ts';import {closeDatabase} from './src/lib/db/client.ts';await claimJob(new Date('2028-03-02T10:00:00Z'));await closeDatabase();`;
    const child = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", script],
      {
        env: { ...process.env },
        encoding: "utf8",
        windowsHide: true,
        timeout: 30000,
      },
    );
    expect(child.status).toBe(0);
    expect(await claimJob(new Date(now.getTime() + 1000))).toBeNull();
    const recovered = await claimJob(new Date(now.getTime() + LEASE_MS + 1));
    expect(recovered?.attemptCount).toBe(2);
    await processClaim(
      recovered!,
      accepted,
      new Date(now.getTime() + LEASE_MS + 1),
    );
    expect(accepted).toHaveBeenCalledTimes(1);
  });
  it("queues on manual confirmation and idempotent repeated planning", async () => {
    const item = await record();
    const c = await collections();
    const count = await c.reminderJobs.countDocuments({ renewalId: item._id });
    expect(count).toBeGreaterThan(0);
    await queue(item);
    await queue(item);
    expect(await c.reminderJobs.countDocuments({ renewalId: item._id })).toBe(
      count,
    );
    expect(
      (await c.reminderJobs.indexes()).some(
        (i) => i.unique && i.key.idempotencyKey,
      ),
    ).toBe(true);
  });
  it("unverified and opted-out owners enqueue nothing", async () => {
    const c = await collections();
    await c.organizations.updateOne(
      { _id: ctx.organization._id },
      { $set: { verifiedNotificationEmail: null, emailOptIn: false } },
    );
    await refresh();
    await record();
    expect(await c.reminderJobs.countDocuments({})).toBe(0);
  });
  it("parallel workers claim once and coalesce overdue offset burst", async () => {
    await record();
    const results = await Promise.all([
      claimJob(now),
      claimJob(now),
      claimJob(now),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    await processClaim(results.find(Boolean)!, accepted, now);
    expect(accepted).toHaveBeenCalledTimes(1);
    expect((await processBatch({ transport: accepted, now })).processed).toBe(
      0,
    );
    expect(
      await (
        await collections()
      ).reminderJobs.countDocuments({ status: "cancelled" }),
    ).toBe(3);
  });
  it("recovers persisted lease after reconnect; stale worker cannot dispatch", async () => {
    await record();
    const first = (await claimJob(now))!;
    await closeDatabase();
    expect(await claimJob(new Date(now.getTime() + 1000))).toBeNull();
    const next = (await claimJob(new Date(now.getTime() + LEASE_MS + 1)))!;
    expect(next._id.equals(first._id)).toBe(true);
    expect(next.leaseToken).not.toBe(first.leaseToken);
    await processClaim(first, accepted, new Date(now.getTime() + LEASE_MS + 1));
    expect(accepted).not.toHaveBeenCalled();
    await processClaim(next, accepted, new Date(now.getTime() + LEASE_MS + 1));
    expect(accepted).toHaveBeenCalledTimes(1);
  });
  it("retries transient 429/500 with backoff and identical provider bytes/key", async () => {
    await record();
    let at = now;
    const transport = vi
      .fn()
      .mockResolvedValueOnce({
        accepted: false,
        code: "PROVIDER_HTTP_429",
        retryable: true,
        retryAfterMs: 120000,
      })
      .mockResolvedValueOnce({
        accepted: false,
        code: "PROVIDER_HTTP_500",
        retryable: true,
      })
      .mockResolvedValue({ accepted: true, id: "synthetic" });
    for (let i = 0; i < 3; i++) {
      const job = (await claimJob(at))!;
      expect(job).toBeTruthy();
      await processClaim(job, transport, at);
      const stored = (await (
        await collections()
      ).reminderJobs.findOne({ _id: job._id }))!;
      if (i < 2) {
        expect(stored.status).toBe("pending");
        expect(await claimJob(new Date(at.getTime() + 1))).toBeNull();
        at = stored.nextAttemptAt;
      } else expect(stored.status).toBe("provider_accepted");
    }
    expect(transport.mock.calls[0]).toEqual(transport.mock.calls[1]);
    expect(transport.mock.calls[1]).toEqual(transport.mock.calls[2]);
  });
  it("invalid recipient result fails terminally and retry budget ends", async () => {
    await record();
    const job = (await claimJob(now))!;
    await processClaim(
      job,
      async () => ({
        accepted: false,
        code: "INVALID_RECIPIENT",
        retryable: false,
      }),
      now,
    );
    expect(
      (await (await collections()).reminderJobs.findOne({ _id: job._id }))
        ?.status,
    ).toBe("failed");
    expect(await claimJob(new Date(now.getTime() + 3600000))).toBeNull();
  });
  it("stops five transient attempts and never retries after idempotency horizon", async () => {
    await record();
    let at = now;
    let id: ObjectId | undefined;
    for (let i = 0; i < 5; i++) {
      const job = (await claimJob(at))!;
      id = job._id;
      await processClaim(
        job,
        async () => ({
          accepted: false,
          code: "PROVIDER_HTTP_500",
          retryable: true,
        }),
        at,
      );
      at = (await (await collections()).reminderJobs.findOne({ _id: id }))!
        .nextAttemptAt;
    }
    expect(
      (await (await collections()).reminderJobs.findOne({ _id: id }))?.status,
    ).toBe("failed");
  });
  it("renew invalidates old claims, queues new version; archive cancels", async () => {
    const item = await record();
    const old = (await claimJob(now))!;
    const v = await renewRenewal(ctx, item._id.toHexString(), {
      version: 1,
      dueDate: "2029-03-01",
      notes: "Synthetic completion",
    });
    await processClaim(old, accepted, now);
    expect(accepted).not.toHaveBeenCalled();
    const c = await collections();
    expect(
      await c.reminderJobs.countDocuments({
        renewalVersion: 1,
        status: { $in: ["pending", "claimed"] },
      }),
    ).toBe(0);
    expect(
      await c.reminderJobs.countDocuments({
        renewalVersion: 2,
        status: "pending",
      }),
    ).toBeGreaterThan(0);
    await archiveRenewal(ctx, v.id, { version: 2 });
    expect(await c.reminderJobs.countDocuments({ status: "pending" })).toBe(0);
  });
  it("settings persist/reschedule; unchanged saves do not replay; opt-out cancels", async () => {
    await record();
    const data = {
      name: ctx.organization.name,
      timezone: "America/New_York",
      emailOptIn: true,
      reminderOffsetsDays: [7, 0],
      reminderLocalTime: "10:00",
    };
    await updateSettings(ctx, data);
    await refresh();
    expect(ctx.organization.notificationRevision).toBe(1);
    const c = await collections();
    expect(
      await c.reminderJobs.countDocuments({
        status: "pending",
        settingsRevision: 1,
      }),
    ).toBeGreaterThan(0);
    const count = await c.reminderJobs.countDocuments({});
    await updateSettings(ctx, data);
    expect(await c.reminderJobs.countDocuments({})).toBe(count);
    await updateSettings(ctx, { ...data, emailOptIn: false });
    expect(await c.reminderJobs.countDocuments({ status: "pending" })).toBe(0);
  });
  it("verification proves mailbox, single-use owner-scoped code; opt-in stays off", async () => {
    let code = "";
    await requestVerification(ctx, async (msg) => {
      code = msg.text.split("\n\n")[2];
      return { accepted: true, id: "synthetic-verification" };
    });
    expect(code.length).toBeGreaterThan(20);
    await expect(confirmVerification(other, { code })).rejects.toMatchObject({
      code: "INVALID_VERIFICATION",
    });
    await confirmVerification(ctx, { code });
    await refresh();
    expect(ctx.organization.verifiedNotificationEmail).toBe(ctx.user.email);
    expect(ctx.organization.emailOptIn).toBe(false);
    await expect(confirmVerification(ctx, { code })).rejects.toMatchObject({
      code: "INVALID_VERIFICATION",
    });
  });
  it("test is owner-only, throttled, audited, and never changes due date", async () => {
    const item = await record();
    const result = await sendTest(ctx, { confirm: true }, accepted);
    expect(result.status).toBe("provider_accepted");
    expect(accepted.mock.calls[0][0].to).toEqual([ctx.user.email]);
    expect(accepted.mock.calls[0][0].text).toContain("TEST");
    expect(
      (await (await collections()).renewals.findOne({ _id: item._id }))
        ?.dueDate,
    ).toBe(item.dueDate);
    await expect(
      sendTest(ctx, { confirm: true }, accepted),
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      sendTest(ctx, { confirm: true, to: "stranger@example.com" }, accepted),
    ).rejects.toBeTruthy();
    expect(previewReminder().delivers).toBe(false);
  });
  it("routes enforce auth, origin, recipient injection and provider unavailable", async () => {
    const base = process.env.APP_URL!;
    expect(
      (
        await testPost(
          new Request(base + "/api/test-email", {
            method: "POST",
            headers: { origin: base, "content-type": "application/json" },
            body: '{"confirm":true}',
          }),
        )
      ).status,
    ).toBe(401);
    const cookie = (await issueSession(ctx.user)).split(";")[0];
    const req = (body: unknown, origin = base) =>
      new Request(base + "/api/test-email", {
        method: "POST",
        headers: { origin, cookie, "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    expect(
      (await testPost(req({ confirm: true }, "https://evil.invalid"))).status,
    ).toBe(403);
    expect(
      (await testPost(req({ confirm: true, to: "other@example.com" }))).status,
    ).toBe(400);
    delete process.env.EMAIL_API_KEY;
    expect((await testPost(req({ confirm: true }))).status).toBe(503);
    expect((await verificationPost(req({}))).status).toBe(503);
    expect(
      (
        await previewGet(
          new Request(base + "/api/reminder-preview", { headers: { cookie } }),
        )
      ).status,
    ).toBe(200);
  });
});
