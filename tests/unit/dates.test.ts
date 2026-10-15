import { describe, expect, it } from "vitest";
import {
  todayInTimezone,
  addCalendarDays,
  displayStatus,
} from "../../src/lib/renewals/dates.ts";
import {
  createRenewalSchema,
  validDate,
} from "../../src/lib/renewals/validation.ts";
describe("business-local date semantics", () => {
  it("uses each organization timezone at a UTC day boundary", () => {
    const now = new Date("2026-10-14T00:30:00Z");
    expect(todayInTimezone("Africa/Lagos", now)).toBe("2026-10-14");
    expect(todayInTimezone("Pacific/Honolulu", now)).toBe("2026-10-13");
    expect(
      displayStatus(
        { dueDate: "2026-10-13", status: "active", timezone: "Africa/Lagos" },
        now,
      ),
    ).toBe("Overdue");
    expect(
      displayStatus(
        {
          dueDate: "2026-10-13",
          status: "active",
          timezone: "Pacific/Honolulu",
        },
        now,
      ),
    ).toBe("Due soon");
  });
  it("handles leap years and inclusive 30-day date windows without duration arithmetic", () => {
    expect(addCalendarDays("2028-02-28", 1)).toBe("2028-02-29");
    const now = new Date("2026-10-14T12:00:00Z");
    expect(
      displayStatus(
        { dueDate: "2026-11-13", status: "active", timezone: "Africa/Lagos" },
        now,
      ),
    ).toBe("Due soon");
    expect(
      displayStatus(
        { dueDate: "2026-11-14", status: "active", timezone: "Africa/Lagos" },
        now,
      ),
    ).toBe("Upcoming");
  });
  it("rejects rollover dates, fractional minor amounts and unsafe fields", () => {
    expect(validDate("2027-02-29")).toBe(false);
    expect(validDate("2028-02-29")).toBe(true);
    expect(
      createRenewalSchema.safeParse({
        title: "Test",
        category: "vehicle",
        dueDate: "2027-01-01",
        dateType: "expiry",
        timezone: "Africa/Lagos",
        amountMinor: 1.5,
        currency: "NGN",
      }).success,
    ).toBe(false);
  });
});
