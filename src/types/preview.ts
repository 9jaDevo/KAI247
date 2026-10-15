// UI-only fixture contracts, not persistence models or real provider results.
export type PreviewCategory =
  | "digital_infrastructure"
  | "vehicle"
  | "regulatory_or_filing"
  | "contract_or_other";
export type PreviewStatus = "Due soon" | "Overdue" | "Upcoming" | "Renewed";
export type PreviewState = "sample" | "empty" | "loading" | "error";
export interface PreviewRenewal {
  id: string;
  title: string;
  provider: string;
  category: PreviewCategory;
  dueDate: string;
  amountMinor: number;
  currency: string;
  owner: string;
  status: PreviewStatus;
  source: "Manual" | "Document confirmed";
  dateType: "renewal" | "expiry" | "filing" | "service";
}
