import type { PreviewCategory, PreviewRenewal } from "@/types/preview";

export const PREVIEW_DATE = "14 October 2026";
export const categoryLabels: Record<PreviewCategory, string> = {
  digital_infrastructure: "Digital infrastructure",
  vehicle: "Vehicle",
  regulatory_or_filing: "Regulatory / filing",
  contract_or_other: "Contract / other",
};
// Entirely synthetic. Statuses are fixed for this preview date, not live calculations.
export const previewRenewals: PreviewRenewal[] = [
  {
    id: "sample-hosting",
    title: "Website hosting",
    provider: "Example Hosting",
    category: "digital_infrastructure",
    dueDate: "2026-10-21",
    amountMinor: 8500000,
    currency: "NGN",
    owner: "Sample owner",
    status: "Due soon",
    source: "Document confirmed",
    dateType: "renewal",
  },
  {
    id: "sample-insurance",
    title: "Delivery van insurance",
    provider: "Example Insurance",
    category: "vehicle",
    dueDate: "2026-10-11",
    amountMinor: 12500000,
    currency: "NGN",
    owner: "Sample owner",
    status: "Overdue",
    source: "Manual",
    dateType: "expiry",
  },
  {
    id: "sample-domain",
    title: "Business domain",
    provider: "Example Registrar",
    category: "digital_infrastructure",
    dueDate: "2026-11-08",
    amountMinor: 2400000,
    currency: "NGN",
    owner: "Sample owner",
    status: "Due soon",
    source: "Manual",
    dateType: "renewal",
  },
  {
    id: "sample-permit",
    title: "Operating permit",
    provider: "User-confirmed example",
    category: "regulatory_or_filing",
    dueDate: "2026-12-04",
    amountMinor: 3000000,
    currency: "NGN",
    owner: "Sample owner",
    status: "Upcoming",
    source: "Manual",
    dateType: "filing",
  },
  {
    id: "sample-contract",
    title: "Equipment service agreement",
    provider: "Example Services",
    category: "contract_or_other",
    dueDate: "2027-10-03",
    amountMinor: 6000000,
    currency: "NGN",
    owner: "Sample owner",
    status: "Renewed",
    source: "Manual",
    dateType: "service",
  },
];
export function filterPreviewRenewals(
  query: string,
  category: string,
  status: string,
) {
  const term = query.trim().toLowerCase();
  return previewRenewals.filter(
    (item) =>
      (!term ||
        `${item.title} ${item.provider} ${item.owner}`
          .toLowerCase()
          .includes(term)) &&
      (category === "all" || item.category === category) &&
      (status === "all" || item.status === status),
  );
}
export function formatPreviewDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
export function formatPreviewAmount(item: PreviewRenewal) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: item.currency,
    maximumFractionDigits: 0,
  }).format(item.amountMinor / 100);
}
