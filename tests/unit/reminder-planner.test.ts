import { describe, it, expect, vi, afterEach } from "vitest";
import { planReminders } from "../../src/lib/notifications/planner.ts";
import {
  sendEmail,
  emailStatus,
} from "../../src/lib/notifications/provider.ts";
const plan = (
  date: string,
  now: string,
  offsets = [30, 7, 1, 0],
  tz = "Africa/Lagos",
  time = "09:00",
) => planReminders(date, tz, offsets, time, new Date(now));
describe("deterministic calendar reminder planning", () => {
  it("uses defaults, Lagos and UTC without mutating date-only values", () => {
    const r = plan("2028-03-01", "2028-01-01T00:00:00Z");
    expect(r.map((p) => p.scheduledForUtc.toISOString())).toEqual([
      "2028-01-31T08:00:00.000Z",
      "2028-02-23T08:00:00.000Z",
      "2028-02-29T08:00:00.000Z",
      "2028-03-01T08:00:00.000Z",
    ]);
  });
  it("coalesces past offsets into one catch-up, retaining future offsets", () => {
    const r = plan("2028-03-01", "2028-02-25T10:00:00Z");
    expect(r.filter((p) => p.immediate)).toHaveLength(1);
    expect(r).toHaveLength(3);
  });
  it("overdue creates one immediate job", () =>
    expect(plan("2028-03-01", "2028-03-04T10:00:00Z")).toHaveLength(1));
  it("exact instant retains due-day job once", () => {
    const r = plan("2028-03-01", "2028-03-01T08:00:00Z");
    expect(r).toHaveLength(1);
    expect(r[0].immediate).toBe(false);
  });
  it("today before delivery does not generate catch-up burst", () => {
    const r = plan("2028-03-01", "2028-03-01T07:00:00Z");
    expect(r).toHaveLength(1);
    expect(r[0].scheduledForUtc.toISOString()).toBe("2028-03-01T08:00:00.000Z");
  });
  it("today after delivery creates exactly one", () =>
    expect(plan("2028-03-01", "2028-03-01T10:00:00Z")).toHaveLength(1));
  it("calendar subtraction crosses DST with 23-hour day", () => {
    const r = plan(
      "2027-03-14",
      "2027-01-01T00:00:00Z",
      [1, 0],
      "America/New_York",
    );
    expect(r.map((p) => p.scheduledForUtc.toISOString())).toEqual([
      "2027-03-13T14:00:00.000Z",
      "2027-03-14T13:00:00.000Z",
    ]);
  });
  it("DST gap moves forward and fold chooses earlier instant", () => {
    expect(
      plan(
        "2027-03-14",
        "2027-01-01T00:00:00Z",
        [0],
        "America/New_York",
        "02:30",
      )[0].scheduledForUtc.toISOString(),
    ).toBe("2027-03-14T07:30:00.000Z");
    expect(
      plan(
        "2027-11-07",
        "2027-01-01T00:00:00Z",
        [0],
        "America/New_York",
        "01:30",
      )[0].scheduledForUtc.toISOString(),
    ).toBe("2027-11-07T05:30:00.000Z");
  });
  it("handles International Date Line and year boundaries", () =>
    expect(
      plan(
        "2028-01-01",
        "2027-01-01T00:00:00Z",
        [0],
        "Pacific/Kiritimati",
      )[0].scheduledForUtc.toISOString(),
    ).toBe("2027-12-31T19:00:00.000Z"));
  it("rejects bad dates, zone, clock and offsets", () => {
    expect(() => plan("2027-02-29", "2027-01-01T00:00:00Z")).toThrow();
    expect(() => plan("2028-01-01", "2027-01-01T00:00:00Z", [-1])).toThrow();
    expect(() =>
      plan("2028-01-01", "2027-01-01T00:00:00Z", [0], "invalid"),
    ).toThrow();
    expect(() =>
      plan("2028-01-01", "2027-01-01T00:00:00Z", [0], "Africa/Lagos", "25:00"),
    ).toThrow();
  });
});
describe("Resend adapter (synthetic transport)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const msg = {
    from: "sender@example.com",
    to: ["owner@example.com"],
    subject: "TEST",
    text: "Synthetic test only",
  };
  it("reports unavailable with no configured credentials", async () => {
    vi.stubEnv("EMAIL_API_KEY", "");
    expect(emailStatus().configured).toBe(false);
    expect(await sendEmail(msg, "fixture")).toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
    });
  });
  it.each([429, 500, 503])(
    "categorizes HTTP %i as retryable",
    async (status) => {
      vi.stubEnv("EMAIL_API_KEY", "synthetic-test-key");
      vi.stubEnv("EMAIL_FROM", msg.from);
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            new Response("{}", { status, headers: { "retry-after": "120" } }),
          ),
      );
      expect(await sendEmail(msg, "fixture")).toMatchObject({
        accepted: false,
        retryable: true,
        retryAfterMs: 120000,
      });
    },
  );
  it("invalid recipient is terminal and never calls fetch", async () => {
    vi.stubEnv("EMAIL_API_KEY", "synthetic-test-key");
    vi.stubEnv("EMAIL_FROM", msg.from);
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await sendEmail({ ...msg, to: ["bad"] }, "fixture")).toMatchObject({
      code: "INVALID_RECIPIENT",
      retryable: false,
    });
    expect(f).not.toHaveBeenCalled();
  });
  it("permanent provider rejection is terminal", async () => {
    vi.stubEnv("EMAIL_API_KEY", "synthetic-test-key");
    vi.stubEnv("EMAIL_FROM", msg.from);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("private body", { status: 422 })),
    );
    expect(await sendEmail(msg, "fixture")).toEqual({
      accepted: false,
      code: "PROVIDER_HTTP_422",
      retryable: false,
    });
  });
  it("uses stable key, fixed endpoint and marks only accepted", async () => {
    vi.stubEnv("EMAIL_API_KEY", "synthetic-test-key");
    vi.stubEnv("EMAIL_FROM", msg.from);
    const f = vi
      .fn()
      .mockResolvedValue(Response.json({ id: "synthetic-provider-id" }));
    vi.stubGlobal("fetch", f);
    expect(await sendEmail(msg, "stable")).toEqual({
      accepted: true,
      id: "synthetic-provider-id",
    });
    expect(f.mock.calls[0][1].headers["Idempotency-Key"]).toBe("stable");
  });
});
