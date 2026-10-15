import type { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  isDemo: boolean;
}
export interface Organization {
  _id: ObjectId;
  ownerUserId: ObjectId;
  name: string;
  timezone: string;
  verifiedNotificationEmail: string | null;
  emailOptIn: boolean;
  reminderOffsetsDays: number[];
  reminderLocalTime: string;
  notificationRevision?: number;
  schedulingFence?: number;
  dispatchFence?: number;
  createdAt: Date;
  updatedAt: Date;
  isDemo: boolean;
}
export type RenewalCategory =
  | "regulatory_or_filing"
  | "digital_infrastructure"
  | "vehicle"
  | "contract_or_other";
export interface Renewal {
  _id: ObjectId;
  organizationId: ObjectId;
  title: string;
  category: RenewalCategory;
  provider?: string;
  assetIdentifier?: string;
  amountMinor?: number;
  currency?: string;
  dueDate: string;
  timezone: string;
  dateType: "expiry" | "renewal" | "filing" | "payment" | "service";
  dateSource: "manual" | "document_confirmed";
  sourceExcerpt?: string;
  sourceFilename?: string;
  sourceHash?: string;
  responsibleLabel?: string;
  notes?: string;
  status: "active" | "renewed" | "archived";
  renewedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  dispatchFence?: number;
}
export type DocumentType =
  | "hosting_invoice"
  | "insurance"
  | "license"
  | "filing_notice"
  | "contract"
  | "other"
  | "unknown";
export type CandidateDateType =
  | "expiry"
  | "renewal"
  | "filing"
  | "payment"
  | "service"
  | "unknown";
export type OtherDateType =
  | "invoice_issue"
  | "payment_due"
  | "grace_period_end"
  | "filing"
  | "service_start"
  | "expiry"
  | "renewal"
  | "other";
/** supported = verbatim evidence found and the raw date parses to one calendar day. */
export type CandidateDateStatus =
  | "supported"
  | "ambiguous"
  | "unsupported"
  | "missing";
export interface EvidenceSnippet {
  before: string;
  match: string;
  after: string;
  page: number | null;
}
export interface CandidateDate {
  raw: string | null;
  /** Deterministically parsed date; null unless exactly one reading is evidence-backed. */
  iso: string | null;
  modelIso: string | null;
  interpretations: string[];
  type: CandidateDateType;
  status: CandidateDateStatus;
  evidence: EvidenceSnippet | null;
}
export interface OtherCandidateDate {
  raw: string;
  iso: string | null;
  interpretations: string[];
  type: OtherDateType;
  evidence: EvidenceSnippet;
}
export interface ExtractionCandidate {
  documentType: DocumentType;
  serviceTitle: string | null;
  provider: string | null;
  providerVerified: boolean;
  date: CandidateDate;
  otherDates: OtherCandidateDate[];
  amount: {
    raw: string | null;
    minor: number | null;
    currency: "NGN" | "USD" | "GBP" | "other" | null;
    verified: boolean;
  };
  /** Untrusted model commentary, shown only as labelled notes. */
  modelNotes: string[];
}
export interface Extraction {
  _id: ObjectId;
  organizationId: ObjectId;
  sourceHash: string;
  originalFilename: string;
  modelId: string;
  textExtractionMethod: string;
  candidateFields: ExtractionCandidate;
  verbatimEvidence: string;
  warnings: string[];
  validationStatus: "pending_review" | "rejected" | "confirmed";
  elapsedMs: number;
  modelAttempts: number;
  createdAt: Date;
  provider: string;
  promptVersion: string;
  pageCount: number;
  textChars: number;
  truncated: boolean;
  usage?: { promptTokens?: number; completionTokens?: number };
  updatedAt: Date;
  reviewedAt?: Date;
  renewalId?: ObjectId;
  rejectionReason?: string;
}
export interface ExtractionView
  extends Omit<
    Extraction,
    | "_id"
    | "organizationId"
    | "createdAt"
    | "updatedAt"
    | "reviewedAt"
    | "renewalId"
  > {
  id: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  renewalId?: string;
}
export interface ReminderJob {
  _id: ObjectId;
  organizationId: ObjectId;
  renewalId: ObjectId;
  renewalVersion: number;
  channel: "email";
  offsetDays: number;
  scheduledForUtc: Date;
  idempotencyKey: string;
  status:
    | "pending"
    | "claimed"
    | "provider_accepted"
    | "delivered"
    | "failed"
    | "cancelled";
  attemptCount: number;
  nextAttemptAt: Date;
  claimedAt?: Date;
  leaseUntil?: Date;
  lastErrorCode?: string;
  providerMessageId?: string;
  kind?: "renewal" | "test";
  settingsRevision?: number;
  immediate?: boolean;
  leaseToken?: string;
  firstAttemptAt?: Date;
  recipientEmail?: string;
  payload?: { from: string; to: string[]; subject: string; text: string };
  attempts?: { at: Date; outcome: string; code?: string }[];
  createdAt: Date;
  updatedAt: Date;
}
export interface EmailVerification {
  _id: ObjectId;
  organizationId: ObjectId;
  userId: ObjectId;
  email: string;
  digest: string;
  expiresAt: Date;
  createdAt: Date;
}
export interface AuditEvent {
  _id: ObjectId;
  organizationId: ObjectId;
  actorUserId?: ObjectId;
  entityType: "renewal" | "organization" | "extraction";
  entityId: ObjectId;
  action: string;
  changesSummary: string;
  createdAt: Date;
}
export interface OwnerContext {
  user: User;
  organization: Organization;
}
export interface SessionRecord {
  _id: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
}
export interface LoginLimit {
  _id: string;
  count: number;
  expiresAt: Date;
}
export type RateLimit = LoginLimit;
export interface RenewalView
  extends Omit<
    Renewal,
    | "_id"
    | "organizationId"
    | "createdAt"
    | "updatedAt"
    | "renewedAt"
    | "completedAt"
  > {
  id: string;
  createdAt: string;
  updatedAt: string;
  renewedAt?: string;
  completedAt?: string;
  displayStatus: "Due soon" | "Overdue" | "Upcoming" | "Renewed" | "Archived";
}
export interface OrganizationView
  extends Omit<
    Organization,
    "_id" | "ownerUserId" | "createdAt" | "updatedAt"
  > {
  id: string;
}
export interface AuditView {
  id: string;
  action: string;
  changesSummary: string;
  createdAt: string;
}
