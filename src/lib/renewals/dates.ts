import type { Renewal, RenewalView } from "../../types/domain.ts";
export const categoryNames = {
  digital_infrastructure: "Digital infrastructure",
  vehicle: "Vehicle",
  regulatory_or_filing: "Regulatory / filing",
  contract_or_other: "Contract / other",
};
export function todayInTimezone(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) =>
    parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function addCalendarDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function displayStatus(
  renewal: Pick<Renewal, "dueDate" | "status" | "timezone">,
  now = new Date(),
): RenewalView["displayStatus"] {
  if (renewal.status === "archived") return "Archived";
  if (renewal.status === "renewed") return "Renewed";
  const today = todayInTimezone(renewal.timezone, now);
  return renewal.dueDate < today
    ? "Overdue"
    : renewal.dueDate <= addCalendarDays(today, 30)
      ? "Due soon"
      : "Upcoming";
}
export function renewalView(item: Renewal, now = new Date()): RenewalView {
  const {
    _id,
    organizationId: _organizationId,
    createdAt,
    updatedAt,
    renewedAt,
    completedAt,
    ...fields
  } = item;
  void _organizationId;
  return {
    ...fields,
    id: _id.toHexString(),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
    ...(renewedAt ? { renewedAt: renewedAt.toISOString() } : {}),
    ...(completedAt ? { completedAt: completedAt.toISOString() } : {}),
    displayStatus: displayStatus(item, now),
  };
}
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
export function formatAmount(item: Pick<Renewal, "amountMinor" | "currency">) {
  return item.amountMinor === undefined
    ? "—"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: item.currency ?? "NGN",
        maximumFractionDigits: 2,
      }).format(item.amountMinor / 100);
}
