import { Temporal } from "@js-temporal/polyfill";
import { dateOnly, timezoneSchema } from "../renewals/validation.ts";

export interface PlannedReminder {
  offsetDays: number;
  scheduledForUtc: Date;
  immediate: boolean;
}
/** Calendar subtraction, then timezone conversion. DST gaps move forward; folds use earlier instant. */
export function planReminders(
  dueDate: string,
  timezone: string,
  offsets: number[],
  localTime: string,
  now: Date,
): PlannedReminder[] {
  dateOnly.parse(dueDate);
  timezoneSchema.parse(timezone);
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(localTime) ||
    offsets.length > 12 ||
    !offsets.length ||
    offsets.some((n) => !Number.isInteger(n) || n < 0 || n > 365)
  )
    throw new Error("Invalid reminder preferences");
  const due = Temporal.PlainDate.from(dueDate);
  const today = Temporal.Instant.from(now.toISOString())
    .toZonedDateTimeISO(timezone)
    .toPlainDate();
  const plans = [...new Set(offsets)]
    .sort((a, b) => b - a)
    .map((offsetDays) => {
      const day = due.subtract({ days: offsetDays });
      const instant = day
        .toPlainDateTime(localTime)
        .toZonedDateTime(timezone, { disambiguation: "compatible" })
        .toInstant();
      return {
        offsetDays,
        scheduledForUtc: new Date(instant.epochMilliseconds),
        immediate: false,
      };
    });
  const future = plans.filter((p) => p.scheduledForUtc >= now);
  const past = plans.filter((p) => p.scheduledForUtc < now);
  // Coalesce missed offsets into ONE alert. Overdue records also receive only one.
  // If a selected alert is still due later today, that alert already covers today.
  const alertToday = future.some((p) =>
    Temporal.Instant.from(p.scheduledForUtc.toISOString())
      .toZonedDateTimeISO(timezone)
      .toPlainDate()
      .equals(today),
  );
  if (past.length && !alertToday) {
    const latest = past[past.length - 1];
    future.unshift({
      ...latest,
      scheduledForUtc: new Date(now),
      immediate: true,
    });
  }
  return future;
}
