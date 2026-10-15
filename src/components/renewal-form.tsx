"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/client-api";
import Link from "next/link";
import { Card, Button, PageHeader, Notice, Dialog } from "./ui";
import { categoryNames as categoryLabels } from "@/lib/renewals/dates";
import type { RenewalView } from "@/types/domain";

export function RenewalForm({
  renewal,
  timezone,
}: {
  renewal?: RenewalView;
  timezone: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [payload, setPayload] = useState<Record<string, unknown>>({});
  const router = useRouter();
  const [error, setError] = useState("");
  function previewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const title = String(fields.get("title") ?? "").trim();
    if (!title) {
      setError("Enter a renewal title, not just spaces.");
      return;
    }
    const amount = String(fields.get("amount") ?? "").trim();
    if (amount && !/^\d+(\.\d{1,2})?$/.test(amount)) {
      setError("Amount must be nonnegative with at most two decimal places.");
      return;
    }
    const data: Record<string, unknown> = {
      title,
      category: fields.get("category"),
      provider: String(fields.get("provider") ?? ""),
      dueDate: fields.get("dueDate"),
      dateType: fields.get("dateType"),
      timezone,
      responsibleLabel: String(fields.get("responsible") ?? ""),
      notes: String(fields.get("notes") ?? ""),
    };
    if (amount) {
      const [major, fraction = ""] = amount.split(".");
      data.amountMinor = Number(major) * 100 + Number(fraction.padEnd(2, "0"));
      data.currency = fields.get("currency");
    }
    if (renewal) data.version = renewal.version;
    setPayload(data);
    setError("");
    setOpen(true);
  }
  return (
    <>
      <Link
        className="back-link"
        href={renewal ? `/app/renewals/${renewal.id}` : "/app/renewals"}
      >
        ← Back to {renewal ? "details" : "renewals"}
      </Link>
      <PageHeader
        eyebrow="MANUAL ENTRY · OWNER-CONFIRMED"
        title={renewal ? "Edit the details." : "Give the next date a place."}
        description="Start with a date you’ve confirmed. Changes are stored in your owner workspace."
      />
      <Notice title="Confirmed dates, persisted safely">
        Saving stores this renewal and an audit event. No AI is used and no
        reminder is scheduled yet.
      </Notice>
      <div className="form-layout">
        <Card>
          <form className="card-content" onSubmit={previewSubmit}>
            <h2 className="form-section-title">Renewal information</h2>
            <div className="form-grid">
              <div className="field field-wide">
                <label htmlFor="title">Renewal title *</label>
                <input
                  id="title"
                  name="title"
                  required
                  maxLength={120}
                  placeholder="e.g. Website hosting"
                  defaultValue={renewal?.title}
                  aria-invalid={!!error}
                  aria-describedby={error ? "title-error" : undefined}
                />
                {error && (
                  <p id="title-error" className="field-error" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  required
                  defaultValue={renewal?.category ?? "digital_infrastructure"}
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="provider">Provider</label>
                <input
                  id="provider"
                  name="provider"
                  maxLength={120}
                  placeholder="e.g. Example Hosting"
                  defaultValue={renewal?.provider}
                />
              </div>
              <div className="field">
                <label htmlFor="due-date">Due date *</label>
                <input
                  id="due-date"
                  name="dueDate"
                  type="date"
                  required
                  defaultValue={renewal?.dueDate}
                  aria-describedby="date-help"
                />
                <span className="field-help" id="date-help">
                  A confirmed business-local date, not an AI prediction.
                </span>
              </div>
              <div className="field">
                <label htmlFor="date-type">Date type *</label>
                <select
                  id="date-type"
                  name="dateType"
                  required
                  defaultValue={renewal?.dateType ?? "renewal"}
                >
                  <option value="renewal">Renewal</option>
                  <option value="expiry">Expiry</option>
                  <option value="filing">Filing (user-confirmed)</option>
                  <option value="payment">Payment</option>
                  <option value="service">Service</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="date-source">Date source *</label>
                <input
                  id="date-source"
                  value={
                    renewal?.dateSource === "document_confirmed"
                      ? "Document confirmed"
                      : "Manual · user-confirmed"
                  }
                  readOnly
                />
              </div>
              <div className="field">
                <label htmlFor="timezone">Timezone *</label>
                <select
                  id="timezone"
                  name="timezone"
                  value={timezone}
                  disabled
                  required
                >
                  <option value={timezone}>{timezone}</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="amount">Amount (optional)</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={
                    renewal?.amountMinor !== undefined
                      ? renewal.amountMinor / 100
                      : undefined
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="currency">Currency</label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue={renewal?.currency ?? "NGN"}
                >
                  <option>NGN</option>
                  <option>USD</option>
                  <option>GBP</option>
                </select>
              </div>
              <div className="field field-wide">
                <label htmlFor="responsible">Responsible person</label>
                <input
                  id="responsible"
                  name="responsible"
                  placeholder="A role or label, e.g. Operations"
                  maxLength={120}
                  defaultValue={renewal?.responsibleLabel}
                />
              </div>
              <div className="field field-wide">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  maxLength={1000}
                  placeholder="Anything you’ll want to remember next time…"
                  defaultValue={renewal?.notes}
                />
              </div>
            </div>
            <div className="form-actions">
              <Link className="button button-secondary" href="/app/renewals">
                Cancel
              </Link>
              <Button type="submit" disabled={pending}>
                Review & save
              </Button>
            </div>
          </form>
        </Card>
        <Card className="form-guide">
          <h2>A date worth checking.</h2>
          <p>
            Not every date on a document is a renewal date. Check what it
            represents before adding it.
          </p>
          <ol>
            <li>Confirm the expiry or renewal date.</li>
            <li>Give the record a clear title.</li>
            <li>Keep the provider and owner in view.</li>
          </ol>
          <p style={{ marginTop: 18 }}>
            Filing dates must be independently confirmed. This is not legal or
            compliance advice.
          </p>
        </Card>
      </div>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Confirm renewal details"
      >
        <p>
          Confirm that the date and its meaning are correct. This will save the
          renewal in your workspace. No reminder will be sent or scheduled.
        </p>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Keep editing
          </Button>
          <Button
            disabled={pending}
            onClick={async () => {
              setPending(true);
              setError("");
              try {
                const result = await clientApi<RenewalView>(
                  renewal ? `/api/renewals/${renewal.id}` : "/api/renewals",
                  renewal ? "PATCH" : "POST",
                  payload,
                );
                router.push(`/app/renewals/${result.id}`);
                router.refresh();
              } catch (error) {
                setError(
                  error instanceof Error ? error.message : "Save failed.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Saving…" : "Confirm & save"}
          </Button>
        </div>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
