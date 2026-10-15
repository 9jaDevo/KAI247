import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { randomBytes, createHash } from "node:crypto";
import { MongoMemoryReplSet } from "mongodb-memory-server-core";
import { sealData } from "iron-session";
import {
  collections,
  closeDatabase,
  ensureIndexes,
} from "../../src/lib/db/client.ts";
import { provisionOwner } from "../../src/lib/auth/provision.ts";
import { verifyPassword } from "../../src/lib/auth/password.ts";
import {
  issueSession,
  SESSION_COOKIE,
  authenticate,
  readSessionCookie,
} from "../../src/lib/auth/session.ts";
import * as routes from "../../src/lib/api/routes.ts";
import type { OwnerContext } from "../../src/types/domain.ts";

let replica: MongoMemoryReplSet;
let first: OwnerContext, second: OwnerContext;
let cookie1: string, cookie2: string;
let id: string;
const password = randomBytes(24).toString("base64url");
const base = "http://localhost:3000";
const input = {
  title: "Synthetic test domain",
  category: "digital_infrastructure",
  provider: "Example Registrar",
  dueDate: "2027-01-20",
  dateType: "renewal",
  timezone: "Africa/Lagos",
  amountMinor: 2500000,
  currency: "NGN",
  responsibleLabel: "Test owner",
  notes: "Synthetic integration record",
};
const req = (
  path: string,
  method = "GET",
  body?: unknown,
  cookie = cookie1,
  origin = base,
) =>
  new Request(`${base}${path}`, {
    method,
    headers: {
      ...(cookie ? { cookie } : {}),
      ...(method !== "GET"
        ? { "content-type": "application/json", origin }
        : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
const json = async (response: Response) => ({
  status: response.status,
  ...(await response.json()),
});
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
  process.env.MONGODB_DB = `kai247_test_${randomBytes(6).toString("hex")}`;
  process.env.APP_URL = base;
  process.env.AUTH_SECRET = randomBytes(48).toString("base64url");
  first = await provisionOwner({
    email: "first@example.invalid",
    password,
    displayName: "Synthetic first owner",
    organizationName: "First isolated test workspace",
    isDemo: true,
  });
  second = await provisionOwner({
    email: "second@example.invalid",
    password,
    displayName: "Synthetic second owner",
    organizationName: "Second isolated test workspace",
    isDemo: true,
  });
  cookie1 = (await issueSession(first.user)).split(";")[0];
  cookie2 = (await issueSession(second.user)).split(";")[0];
});
afterAll(async () => {
  await closeDatabase();
  await replica?.stop();
});
describe("real local MongoDB owner integration (synthetic data)", () => {
  it("has unique and expiry indexes; passwords are salted hashes, never plain values", async () => {
    await ensureIndexes();
    const c = await collections();
    expect(first.user.passwordHash).not.toContain(password);
    expect(await verifyPassword(password, first.user.passwordHash)).toBe(true);
    expect(
      await verifyPassword("incorrect-password", first.user.passwordHash),
    ).toBe(false);
    expect(
      (await c.reminderJobs.indexes()).some(
        (index) => index.unique && index.key.idempotencyKey === 1,
      ),
    ).toBe(true);
    expect(
      (await c.users.indexes()).some(
        (index) => index.unique && index.key.email === 1,
      ),
    ).toBe(true);
  });
  it("rejects missing, forged and old preview cookies", async () => {
    for (const cookie of [
      "",
      `${SESSION_COOKIE}=forged`,
      "kai247_preview=synthetic-only",
    ])
      expect(
        (
          await routes.renewalsGet(
            req("/api/renewals", "GET", undefined, cookie),
          )
        ).status,
      ).toBe(401);
  });
  it("validates login, origin and encrypted cookie flags without leaking secrets", async () => {
    const wrong = await json(
      await routes.login(
        req(
          "/api/auth/login",
          "POST",
          { email: first.user.email, password: "incorrect-password" },
          "",
        ),
      ),
    );
    expect(wrong.status).toBe(401);
    expect(wrong.error.code).toBe("INVALID_CREDENTIALS");
    const login = await routes.login(
      req("/api/auth/login", "POST", { email: first.user.email, password }, ""),
    );
    expect(login.status).toBe(200);
    expect(login.headers.get("set-cookie")).toContain("HttpOnly");
    expect(login.headers.get("set-cookie")).toContain("SameSite=Lax");
    expect(await login.text()).not.toContain("passwordHash");
    expect(
      (
        await routes.login(
          req(
            "/api/auth/login",
            "POST",
            { email: first.user.email, password },
            "",
            "https://evil.invalid",
          ),
        )
      ).status,
    ).toBe(403);
  });
  it("creates and reads a persisted owner-scoped record with an audit event", async () => {
    const result = await json(
      await routes.renewalsPost(req("/api/renewals", "POST", input)),
    );
    expect(result.status).toBe(201);
    id = result.data.id;
    const detail = await json(
      await routes.renewalGet(req(`/api/renewals/${id}`), id),
    );
    expect(detail.data.renewal.dueDate).toBe(input.dueDate);
    expect(detail.data.renewal.amountMinor).toBe(2500000);
    expect(detail.data.history[0].action).toBe("created");
    const reread = await json(await routes.renewalsGet(req("/api/renewals")));
    expect(reread.data).toHaveLength(1);
  });
  it("rejects cross-owner read/update/archive/renew and organization injection", async () => {
    expect(
      (
        await routes.renewalGet(
          req(`/api/renewals/${id}`, "GET", undefined, cookie2),
          id,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await routes.renewalPatch(
          req(
            `/api/renewals/${id}`,
            "PATCH",
            { ...input, version: 1 },
            cookie2,
          ),
          id,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await routes.renewalDelete(
          req(`/api/renewals/${id}`, "DELETE", { version: 1 }, cookie2),
          id,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await routes.renewalRenew(
          req(
            `/api/renewals/${id}/renew`,
            "POST",
            { dueDate: "2028-01-20", version: 1 },
            cookie2,
          ),
          id,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await routes.renewalsPost(
          req("/api/renewals", "POST", {
            ...input,
            organizationId: second.organization._id.toHexString(),
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await json(
          await routes.renewalsGet(
            req("/api/renewals", "GET", undefined, cookie2),
          ),
        )
      ).data,
    ).toEqual([]);
  });
  it("rejects malformed IDs, impossible dates, fractional/negative amounts and query operator injection", async () => {
    expect(
      (await routes.renewalGet(req("/api/renewals/nope"), "nope")).status,
    ).toBe(400);
    for (const extra of [
      { dueDate: "2027-02-29" },
      { amountMinor: -1 },
      { amountMinor: 0.1 },
      { title: { $ne: "" } },
      { dateSource: "document_confirmed" },
      { timezone: "Not/AZone" },
    ])
      expect(
        (
          await routes.renewalsPost(
            req("/api/renewals", "POST", { ...input, ...extra }),
          )
        ).status,
      ).toBe(400);
    expect(
      (await json(await routes.renewalsGet(req("/api/renewals?q=.*")))).data,
    ).toEqual([]);
  });
  it("rejects missing/cross-site mutation origins and oversized JSON bodies", async () => {
    const cross = await routes.renewalsPost(
      req("/api/renewals", "POST", input, cookie1, "https://evil.invalid"),
    );
    expect(cross.status).toBe(403);
    const missing = req("/api/renewals", "POST", input);
    missing.headers.delete("origin");
    expect((await routes.renewalsPost(missing)).status).toBe(403);
    expect(
      (
        await routes.renewalsPost(
          req("/api/renewals", "POST", { ...input, notes: "x".repeat(40000) }),
        )
      ).status,
    ).toBe(413);
  });
  it("edits with optimistic version checking and rejects stale updates", async () => {
    const result = await json(
      await routes.renewalPatch(
        req(`/api/renewals/${id}`, "PATCH", {
          ...input,
          title: "Synthetic edited domain",
          amountMinor: 2700000,
          version: 1,
        }),
        id,
      ),
    );
    expect(result.status).toBe(200);
    expect(result.data.version).toBe(2);
    expect(
      (
        await routes.renewalPatch(
          req(`/api/renewals/${id}`, "PATCH", { ...input, version: 1 }),
          id,
        )
      ).status,
    ).toBe(409);
  });
  it("renews atomically, retains history/notes, cancels old jobs and creates no new jobs", async () => {
    const c = await collections();
    const item = await c.renewals.findOne({ title: "Synthetic edited domain" });
    const now = new Date();
    await c.reminderJobs.insertOne({
      _id: new (await import("mongodb")).ObjectId(),
      organizationId: first.organization._id,
      renewalId: item!._id,
      renewalVersion: 2,
      channel: "email",
      offsetDays: 7,
      scheduledForUtc: now,
      idempotencyKey: "synthetic-old-version",
      status: "pending",
      attemptCount: 0,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    });
    const result = await json(
      await routes.renewalRenew(
        req(`/api/renewals/${id}/renew`, "POST", {
          version: 2,
          dueDate: "2028-01-20",
          notes: "Synthetic completion note",
        }),
        id,
      ),
    );
    expect(result.data.version).toBe(3);
    expect(result.data.dueDate).toBe("2028-01-20");
    expect(result.data.completedAt).toBeTruthy();
    expect(
      (
        await json(
          await routes.renewalsGet(req("/api/renewals?status=completed")),
        )
      ).data.some((item: { id: string }) => item.id === id),
    ).toBe(true);
    expect(result.data.notes).toBe("Synthetic completion note");
    expect(
      (
        await c.reminderJobs.findOne({
          idempotencyKey: "synthetic-old-version",
        })
      )?.status,
    ).toBe("cancelled");
    expect(
      await c.reminderJobs.countDocuments({
        organizationId: first.organization._id,
      }),
    ).toBe(1);
    const detail = await json(
      await routes.renewalGet(req(`/api/renewals/${id}`), id),
    );
    expect(
      detail.data.history.map((event: { action: string }) => event.action),
    ).toContain("renewed");
    expect(
      (
        await routes.renewalRenew(
          req(`/api/renewals/${id}/renew`, "POST", {
            version: 3,
            dueDate: "2027-01-20",
          }),
          id,
        )
      ).status,
    ).toBe(400);
  });
  it("saves owner-scoped settings, invalidates unverified email opt-in and arbitrary recipients", async () => {
    const data = {
      name: "First renamed workspace",
      timezone: "Europe/London",
      emailOptIn: false,
      reminderOffsetsDays: [7, 1, 0],
      reminderLocalTime: "09:15",
    };
    expect(
      (await routes.settingsPatch(req("/api/settings", "PATCH", data))).status,
    ).toBe(200);
    expect(
      (
        await json(
          await routes.settingsGet(
            req("/api/settings", "GET", undefined, cookie2),
          ),
        )
      ).data.organization.name,
    ).toBe("Second isolated test workspace");
    expect(
      (
        await routes.settingsPatch(
          req("/api/settings", "PATCH", { ...data, emailOptIn: true }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await routes.settingsPatch(
          req("/api/settings", "PATCH", {
            ...data,
            verifiedNotificationEmail: "stranger@example.invalid",
          }),
        )
      ).status,
    ).toBe(400);
  });
  it("permits only one concurrent edit for the same record version", async () => {
    const current = await json(
      await routes.renewalGet(req(`/api/renewals/${id}`), id),
    );
    const changes = await Promise.all(
      ["Concurrent edit A", "Concurrent edit B"].map((title) =>
        routes.renewalPatch(
          req(`/api/renewals/${id}`, "PATCH", {
            ...input,
            title,
            timezone: "Europe/London",
            version: current.data.renewal.version,
          }),
          id,
        ),
      ),
    );
    expect(changes.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
  });
  it("archives instead of deleting; archived records are excluded from default lists", async () => {
    const current = await json(
      await routes.renewalGet(req(`/api/renewals/${id}`), id),
    );
    const result = await json(
      await routes.renewalDelete(
        req(`/api/renewals/${id}`, "DELETE", {
          version: current.data.renewal.version,
        }),
        id,
      ),
    );
    expect(result.data.status).toBe("archived");
    expect(
      (await json(await routes.renewalsGet(req("/api/renewals")))).data,
    ).toHaveLength(0);
    expect(
      (
        await json(
          await routes.renewalsGet(req("/api/renewals?status=archived")),
        )
      ).data,
    ).toHaveLength(1);
    expect(
      (await routes.renewalGet(req(`/api/renewals/${id}`), id)).status,
    ).toBe(200);
  });
  it("enforces sealed expiry, datastore expiry and logout revocation", async () => {
    const expired = await sealData(
      {
        userId: first.user._id.toHexString(),
        token: randomBytes(32).toString("hex"),
        expiresAt: Date.now() - 1,
      },
      { password: process.env.AUTH_SECRET!, ttl: 3600 },
    );
    expect(
      (
        await routes.me(
          req("/api/auth/me", "GET", undefined, `${SESSION_COOKIE}=${expired}`),
        )
      ).status,
    ).toBe(401);
    const stored = await issueSession(second.user);
    const sealed = decodeURIComponent(stored.split(";")[0].split("=")[1]);
    const data = await readSessionCookie(sealed);
    await (
      await collections()
    ).sessions.updateOne(
      { _id: createHash("sha256").update(data.token!).digest("hex") },
      { $set: { expiresAt: new Date(Date.now() - 1000) } },
    );
    expect(
      (
        await routes.me(
          req("/api/auth/me", "GET", undefined, stored.split(";")[0]),
        )
      ).status,
    ).toBe(401);
    expect(
      (await routes.logout(req("/api/auth/logout", "POST", {}, cookie1)))
        .status,
    ).toBe(200);
    expect((await routes.me(req("/api/auth/me"))).status).toBe(401);
    expect(
      (
        await authenticate(req("/api/auth/me", "GET", undefined, cookie2))
      ).user._id.equals(second.user._id),
    ).toBe(true);
  });
  it("rate limits failed sign-ins in the shared datastore", async () => {
    for (let i = 0; i < 10; i++)
      await routes.login(
        req(
          "/api/auth/login",
          "POST",
          { email: "limited@example.invalid", password: "incorrect-password" },
          "",
        ),
      );
    expect(
      (
        await routes.login(
          req(
            "/api/auth/login",
            "POST",
            {
              email: "limited@example.invalid",
              password: "incorrect-password",
            },
            "",
          ),
        )
      ).status,
    ).toBe(429);
  });
});
