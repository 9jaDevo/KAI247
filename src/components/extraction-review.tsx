"use client";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ActionLink,
  Button,
  Card,
  Dialog,
  EmptyState,
  Notice,
  PageHeader,
  Pill,
} from "./ui";
import { clientApi } from "@/lib/client-api";
import { categoryNames, formatDate } from "@/lib/renewals/dates";
import {
  dateStatusLabels,
  documentTypeLabels,
  evidenceDates,
  otherDateLabels,
  reviewLabels,
  suggestedCategory,
} from "@/lib/extractions/labels";
import type {
  EvidenceSnippet,
  ExtractionView,
  OtherCandidateDate,
} from "@/types/domain";

const dateTypes = [
  ["renewal", "Renewal"],
  ["expiry", "Expiry"],
  ["payment", "Payment"],
  ["filing", "Filing (owner-verified)"],
  ["service", "Service"],
] as const;
const otherToDateType: Partial<Record<OtherCandidateDate["type"], string>> = {
  expiry: "expiry",
  renewal: "renewal",
  payment_due: "payment",
  filing: "filing",
  service_start: "service",
};

function EvidenceQuote({
  snippet,
  label,
}: {
  snippet: EvidenceSnippet;
  label: string;
}) {
  return (
    <figure className="evidence">
      <blockquote className="source-quote evidence-quote">
        {snippet.before && (
          <span className="evidence-context">{snippet.before}</span>
        )}
        <mark>{snippet.match}</mark>
        {snippet.after && (
          <span className="evidence-context">{snippet.after}</span>
        )}
      </blockquote>
      <figcaption className="small muted">
        {label}
        {snippet.page ? ` · page ${snippet.page}` : ""} · highlighted text is
        copied exactly from the uploaded document
      </figcaption>
    </figure>
  );
}

export function ExtractionReview({
  extraction,
  timezone,
}: {
  extraction: ExtractionView;
  timezone: string;
}) {
  const router = useRouter();
  const candidate = extraction.candidateFields;
  const backed = useMemo(() => evidenceDates(candidate), [candidate]);
  const pendingReview = extraction.validationStatus === "pending_review";
  const confirmable = pendingReview && backed.size > 0;
  const [title, setTitle] = useState(candidate.serviceTitle ?? "");
  const [category, setCategory] = useState<string>(
    suggestedCategory(candidate),
  );
  const [provider, setProvider] = useState(candidate.provider ?? "");
  const [dateType, setDateType] = useState<string>(
    candidate.date.type === "unknown" ? "" : candidate.date.type,
  );
  const [dueDate, setDueDate] = useState(candidate.date.iso ?? "");
  const [amount, setAmount] = useState(
    candidate.amount.minor === null
      ? ""
      : (candidate.amount.minor / 100).toFixed(2),
  );
  const [currency, setCurrency] = useState<string>(
    candidate.amount.currency && candidate.amount.currency !== "other"
      ? candidate.amount.currency
      : "NGN",
  );
  const [responsible, setResponsible] = useState("");
  const [notes, setNotes] = useState("");
  const [checked, setChecked] = useState(false);
  const [acknowledge, setAcknowledge] = useState(false);
  const [dialog, setDialog] = useState<"confirm" | "reject" | null>(null);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const differs = !!dueDate && !backed.has(dueDate);
  const [statusLabel, statusTone] = dateStatusLabels[candidate.date.status];
  const [reviewLabel, reviewTone] = reviewLabels[extraction.validationStatus];

  function pickDate(value: string, type?: string) {
    setDueDate(value);
    setAcknowledge(false);
    setChecked(false);
    if (type) setDateType(type);
  }
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!title.trim()) return setError("Enter a renewal title.");
    if (!dueDate) return setError("Choose or enter the due date.");
    if (!dateType) return setError("Choose the date type.");
    if (amount && !/^\d+(\.\d{1,2})?$/.test(amount.trim()))
      return setError(
        "Amount must be nonnegative with at most two decimal places.",
      );
    const data: Record<string, unknown> = {
      title: title.trim(),
      category,
      provider: provider.trim(),
      dueDate,
      dateType,
      timezone,
      responsibleLabel: responsible.trim(),
      notes: notes.trim(),
      evidenceChecked: checked,
      ...(differs ? { acknowledgeDateDiffers: acknowledge } : {}),
    };
    for (const key of ["provider", "responsibleLabel", "notes"])
      if (!data[key]) delete data[key];
    if (amount.trim()) {
      const [major, fraction = ""] = amount.trim().split(".");
      data.amountMinor = Number(major) * 100 + Number(fraction.padEnd(2, "0"));
      data.currency = currency;
    }
    setPayload(data);
    setDialog("confirm");
  }
  async function confirm() {
    setPending(true);
    setError("");
    try {
      const result = await clientApi<{ renewal: { id: string } }>(
        `/api/extractions/${extraction.id}/confirm`,
        "POST",
        payload,
      );
      router.push(`/app/renewals/${result.renewal.id}`);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Confirmation failed.",
      );
      setDialog(null);
      setPending(false);
    }
  }
  async function reject() {
    setPending(true);
    setError("");
    try {
      await clientApi(`/api/extractions/${extraction.id}/reject`, "POST", {
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      setDialog(null);
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Decline failed.");
      setDialog(null);
    } finally {
      setPending(false);
    }
  }

  const provenance = (
    <dl className="provenance">
      <div>
        <dt>Document</dt>
        <dd>{extraction.originalFilename}</dd>
      </div>
      <div>
        <dt>Model</dt>
        <dd>
          {extraction.modelId}{" "}
          <span className="muted">via {extraction.provider}</span>
        </dd>
      </div>
      <div>
        <dt>Measured model time</dt>
        <dd>{(extraction.elapsedMs / 1000).toFixed(1)} s</dd>
      </div>
      <div>
        <dt>Text source</dt>
        <dd>
          {extraction.textExtractionMethod === "pdf_text_layer"
            ? `PDF text layer · ${extraction.pageCount} page${extraction.pageCount === 1 ? "" : "s"}`
            : "Plain text file"}
          {extraction.truncated ? " · truncated" : ""}
        </dd>
      </div>
      <div>
        <dt>Fingerprint</dt>
        <dd>
          <code>sha256 {extraction.sourceHash.slice(0, 12)}…</code>
        </dd>
      </div>
      <div>
        <dt>Document type</dt>
        <dd>{documentTypeLabels[candidate.documentType]} · Gemma suggestion</dd>
      </div>
    </dl>
  );

  return (
    <>
      <Link className="back-link" href="/app/import">
        ← Back to import
      </Link>
      <PageHeader
        eyebrow="HUMAN REVIEW · GEMMA CANDIDATE"
        title="You have the final say."
        description="Compare each candidate with the highlighted source. Nothing becomes a renewal until you confirm it."
        actions={
          <>
            <Pill tone={statusTone}>Date: {statusLabel}</Pill>
            <Pill tone={reviewTone}>{reviewLabel}</Pill>
          </>
        }
      />
      {extraction.validationStatus === "confirmed" && (
        <Notice title="Confirmed by the owner">
          This candidate was reviewed and saved as a renewal
          {extraction.reviewedAt
            ? ` on ${new Date(extraction.reviewedAt).toLocaleString("en-GB", { timeZone: timezone })}`
            : ""}
          .{" "}
          {extraction.renewalId && (
            <Link href={`/app/renewals/${extraction.renewalId}`}>
              Open the renewal →
            </Link>
          )}
        </Notice>
      )}
      {extraction.validationStatus === "rejected" && (
        <Notice title="Declined — no renewal was created">
          {extraction.rejectionReason
            ? `Reason: ${extraction.rejectionReason}`
            : "No reason was given."}
        </Notice>
      )}
      {extraction.warnings.length > 0 && (
        <div
          className="notice notice-warning"
          role="region"
          aria-label="Checks that need attention"
        >
          <div>
            <strong>Checks that need your attention</strong>
            <ul className="warning-list">
              {extraction.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {error && (
        <p className="field-error form-error" role="alert">
          {error}
        </p>
      )}
      <div className="detail-grid review-grid">
        <div>
          {confirmable ? (
            <Card>
              <div className="card-header">
                <div>
                  <h2>Candidate details</h2>
                  <p className="muted">Edit anything before you approve.</p>
                </div>
              </div>
              <form className="card-content" onSubmit={prepare} noValidate>
                <div className="form-grid">
                  <div className="field field-wide">
                    <label htmlFor="candidate-title">
                      Renewal title * <Pill>Gemma suggestion</Pill>
                    </label>
                    <input
                      id="candidate-title"
                      value={title}
                      maxLength={120}
                      required
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="candidate-category">
                      Category * <Pill>Suggested · check</Pill>
                    </label>
                    <select
                      id="candidate-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                    >
                      {Object.entries(categoryNames).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="candidate-provider">
                      Provider{" "}
                      {candidate.provider &&
                        (candidate.providerVerified ? (
                          <Pill tone="teal">In document</Pill>
                        ) : (
                          <Pill tone="amber">Not found verbatim</Pill>
                        ))}
                    </label>
                    <input
                      id="candidate-provider"
                      value={provider}
                      maxLength={120}
                      onChange={(event) => setProvider(event.target.value)}
                    />
                  </div>
                  <fieldset className="field field-wide date-choice">
                    <legend>
                      Due date * <Pill tone={statusTone}>{statusLabel}</Pill>
                    </legend>
                    {candidate.date.status === "ambiguous" &&
                      candidate.date.interpretations.length > 1 && (
                        <div className="choice-list">
                          {candidate.date.interpretations.map(
                            (value, index) => (
                              <label className="checkbox-label" key={value}>
                                <input
                                  type="radio"
                                  name="interpretation"
                                  checked={dueDate === value}
                                  onChange={() => pickDate(value)}
                                />
                                {formatDate(value)} (
                                {index === 0
                                  ? "read as DD/MM"
                                  : "read as MM/DD"}
                                )
                              </label>
                            ),
                          )}
                        </div>
                      )}
                    <label htmlFor="candidate-date" className="sr-only">
                      Due date
                    </label>
                    <input
                      id="candidate-date"
                      type="date"
                      value={dueDate}
                      required
                      aria-describedby="candidate-date-help"
                      onChange={(event) => pickDate(event.target.value)}
                    />
                    <span id="candidate-date-help" className="field-help">
                      {candidate.date.raw
                        ? `Written in the document as “${candidate.date.raw}”.`
                        : "No renewal date was verified; pick a document date below or enter one."}
                    </span>
                    {differs && (
                      <div className="override">
                        <Notice
                          title="This date is not in the document evidence"
                          tone="warning"
                        >
                          It will be saved as an owner-entered date, not a
                          document-confirmed one.
                        </Notice>
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={acknowledge}
                            onChange={(event) =>
                              setAcknowledge(event.target.checked)
                            }
                          />
                          I confirm this date is correct even though the
                          document does not show it.
                        </label>
                      </div>
                    )}
                  </fieldset>
                  <div className="field">
                    <label htmlFor="candidate-type">
                      Date type *{" "}
                      {candidate.date.type === "unknown" && (
                        <Pill tone="amber">Choose</Pill>
                      )}
                    </label>
                    <select
                      id="candidate-type"
                      value={dateType}
                      required
                      onChange={(event) => setDateType(event.target.value)}
                    >
                      <option value="" disabled>
                        Select…
                      </option>
                      {dateTypes.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="candidate-amount">
                      Amount{" "}
                      {candidate.amount.verified ? (
                        <Pill tone="teal">In document</Pill>
                      ) : (
                        <Pill>Not prefilled</Pill>
                      )}
                    </label>
                    <div className="amount-row">
                      <input
                        id="candidate-amount"
                        inputMode="decimal"
                        value={amount}
                        placeholder="0.00"
                        onChange={(event) => setAmount(event.target.value)}
                      />
                      <label htmlFor="candidate-currency" className="sr-only">
                        Currency
                      </label>
                      <select
                        id="candidate-currency"
                        value={currency}
                        onChange={(event) => setCurrency(event.target.value)}
                      >
                        <option value="NGN">NGN</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="candidate-responsible">
                      Responsible person
                    </label>
                    <input
                      id="candidate-responsible"
                      value={responsible}
                      maxLength={120}
                      onChange={(event) => setResponsible(event.target.value)}
                    />
                  </div>
                  <div className="field field-wide">
                    <label htmlFor="candidate-notes">Notes</label>
                    <textarea
                      id="candidate-notes"
                      rows={3}
                      maxLength={2000}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </div>
                </div>
                <label className="checkbox-label confirm-check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => setChecked(event.target.checked)}
                  />
                  I checked the highlighted source evidence and confirm these
                  details.
                </label>
                <div className="form-actions">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setDialog("reject")}
                  >
                    Decline candidate
                  </Button>
                  <Button
                    type="submit"
                    disabled={!checked || !dueDate || (differs && !acknowledge)}
                  >
                    Approve &amp; save
                  </Button>
                </div>
              </form>
            </Card>
          ) : pendingReview ? (
            <Card>
              <EmptyState
                icon="document"
                title="No dependable date to confirm"
                description="Gemma did not return a date whose evidence could be verified in this document. Nothing can be saved from it automatically or by approval."
              >
                <div className="actions centered-actions">
                  <ActionLink href="/app/renewals/new">
                    Add renewal manually
                  </ActionLink>
                  <Button
                    variant="secondary"
                    onClick={() => setDialog("reject")}
                  >
                    Decline candidate
                  </Button>
                </div>
              </EmptyState>
            </Card>
          ) : (
            <Card className="card-content">
              <h2 className="form-section-title">Candidate as extracted</h2>
              <dl className="details-list">
                <div>
                  <dt>Title suggestion</dt>
                  <dd>{candidate.serviceTitle ?? "—"}</dd>
                </div>
                <div>
                  <dt>Provider</dt>
                  <dd>{candidate.provider ?? "—"}</dd>
                </div>
                <div>
                  <dt>Date as written</dt>
                  <dd>{candidate.date.raw ?? "—"}</dd>
                </div>
                <div>
                  <dt>Date reading</dt>
                  <dd>
                    {candidate.date.interpretations
                      .map(formatDate)
                      .join(" or ") || "—"}
                  </dd>
                </div>
              </dl>
            </Card>
          )}
          {candidate.modelNotes.length > 0 && (
            <details className="state-control model-notes">
              <summary>Gemma’s own notes (unverified)</summary>
              <ul>
                {candidate.modelNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
        <div className="review-side">
          <Card className="card-content">
            <p className="eyebrow">SOURCE EVIDENCE</p>
            <h2>Check the original wording.</h2>
            {candidate.date.evidence ? (
              <EvidenceQuote
                snippet={candidate.date.evidence}
                label={
                  candidate.date.status === "unsupported"
                    ? "Discarded: this quote does not support a usable date"
                    : `Primary candidate · ${extraction.originalFilename}`
                }
              />
            ) : (
              <p className="muted evidence-empty">
                No verbatim evidence for a renewal date was found in the
                document.
              </p>
            )}
          </Card>
          {candidate.otherDates.length > 0 && (
            <Card className="card-content">
              <p className="eyebrow">OTHER DATES IN THE DOCUMENT</p>
              <h2>Classified, not chosen.</h2>
              <ul className="other-dates">
                {candidate.otherDates.map((item) => (
                  <li key={`${item.type}-${item.raw}`}>
                    <div className="other-date-heading">
                      <strong>{otherDateLabels[item.type]}</strong>
                      <span>
                        {item.raw}
                        {item.interpretations.length > 0 &&
                          ` → ${item.interpretations.map(formatDate).join(" or ")}`}
                      </span>
                    </div>
                    <EvidenceQuote
                      snippet={item.evidence}
                      label="Verified quote"
                    />
                    {confirmable &&
                      item.interpretations.map((value) => (
                        <Button
                          key={value}
                          type="button"
                          variant="quiet"
                          className="use-date"
                          onClick={() =>
                            pickDate(value, otherToDateType[item.type])
                          }
                        >
                          Use {formatDate(value)}
                        </Button>
                      ))}
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card className="card-content">
            <p className="eyebrow">PROVENANCE</p>
            {provenance}
          </Card>
        </div>
      </div>
      <Dialog
        open={dialog === "confirm"}
        onClose={() => {
          if (!pending) setDialog(null);
        }}
        title="Save this confirmed renewal?"
      >
        <p>
          <strong>{String(payload.title ?? "")}</strong> ·{" "}
          {payload.dueDate ? formatDate(String(payload.dueDate)) : ""} ·{" "}
          {String(payload.dateType ?? "")}
        </p>
        <p className="small muted" style={{ marginTop: 10 }}>
          {differs
            ? "This date is owner-entered and will be labelled as manual."
            : "This date matches verified document evidence."}{" "}
          Reminder scheduling is not active yet; no email will be sent.
        </p>
        <div className="dialog-actions">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => setDialog(null)}
          >
            Keep reviewing
          </Button>
          <Button disabled={pending} onClick={() => void confirm()}>
            {pending ? "Saving…" : "Confirm and save"}
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={dialog === "reject"}
        onClose={() => {
          if (!pending) setDialog(null);
        }}
        title="Decline this candidate?"
      >
        <p>
          No renewal will be created. The decision is kept in the audit trail.
        </p>
        <div className="field" style={{ marginTop: 16 }}>
          <label htmlFor="reject-reason">Reason (optional)</label>
          <input
            id="reject-reason"
            maxLength={300}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        <div className="dialog-actions">
          <Button
            variant="secondary"
            disabled={pending}
            onClick={() => setDialog(null)}
          >
            Cancel
          </Button>
          <Button disabled={pending} onClick={() => void reject()}>
            {pending ? "Declining…" : "Decline candidate"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
