"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionLink, Button, Card, Dialog, Notice, PageHeader } from "./ui";
import { StoredStatus } from "./stored-renewal-table";
import { categoryNames, formatDate, formatAmount } from "@/lib/renewals/dates";
import { clientApi } from "@/lib/client-api";
import type { RenewalView, AuditView } from "@/types/domain";
export function RenewalDetail({
  renewal,
  history,
}: {
  renewal: RenewalView;
  history: AuditView[];
}) {
  const [dialog, setDialog] = useState<"renew" | "archive" | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  async function mutate(body: unknown) {
    setPending(true);
    setError("");
    try {
      await clientApi(
        `/api/renewals/${renewal.id}${dialog === "renew" ? "/renew" : ""}`,
        dialog === "renew" ? "POST" : "DELETE",
        body,
      );
      setDialog(null);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <Link className="back-link" href="/app/renewals">
        ← Back to renewals
      </Link>
      <PageHeader
        eyebrow="OWNER-CONFIRMED RENEWAL"
        title={renewal.title}
        description={`${renewal.provider || "No provider"} · ${categoryNames[renewal.category]}`}
        actions={
          <>
            <StoredStatus status={renewal.displayStatus} />
            {renewal.status !== "archived" && (
              <ActionLink
                href={`/app/renewals/${renewal.id}/edit`}
                variant="secondary"
              >
                Edit details
              </ActionLink>
            )}
          </>
        }
      />
      <div className="detail-grid">
        <div>
          <Card>
            <div className="card-header">
              <h2>The details that matter</h2>
            </div>
            <div className="card-content">
              <dl className="details-list">
                {[
                  ["Due date", formatDate(renewal.dueDate)],
                  ["Amount", formatAmount(renewal)],
                  ["Date type", renewal.dateType],
                  [
                    "Source",
                    renewal.dateSource === "manual"
                      ? "Manual · owner-confirmed"
                      : "Document confirmed",
                  ],
                  ["Responsible", renewal.responsibleLabel || "Owner"],
                  ["Timezone", renewal.timezone],
                  ["Record version", String(renewal.version)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {renewal.completedAt && (
                <p className="small muted" style={{ marginTop: 24 }}>
                  Previous cycle completed on{" "}
                  {new Date(renewal.completedAt).toLocaleDateString("en-GB", {
                    timeZone: renewal.timezone,
                  })}
                  . The replacement date is now actively tracked.
                </p>
              )}
              {renewal.notes && (
                <div style={{ marginTop: 24 }}>
                  <h3>Owner notes</h3>
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      marginTop: 10,
                    }}
                  >
                    {renewal.notes}
                  </p>
                </div>
              )}
              {renewal.sourceExcerpt && (
                <div style={{ marginTop: 24 }}>
                  <h3>Source evidence</h3>
                  <blockquote className="source-quote evidence-quote">
                    <mark>{renewal.sourceExcerpt}</mark>
                  </blockquote>
                  <p className="small muted" style={{ marginTop: 10 }}>
                    {renewal.sourceFilename} · copied exactly from the document
                    you confirmed
                  </p>
                </div>
              )}
              {!renewal.sourceExcerpt && renewal.sourceFilename && (
                <p className="small muted" style={{ marginTop: 24 }}>
                  Linked document: {renewal.sourceFilename}. The due date was
                  entered by the owner and is not quoted from it.
                </p>
              )}
            </div>
          </Card>
          <Card className="card-content">
            <h2 className="form-section-title">Change history</h2>
            <ol className="audit-history">
              {history.map((event) => (
                <li key={event.id}>
                  <strong>{event.action.replaceAll("_", " ")}</strong>
                  <span>
                    {new Date(event.createdAt).toLocaleString("en-GB", {
                      timeZone: renewal.timezone,
                    })}
                  </span>
                  <p>{event.changesSummary}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <Card className="detail-actions">
          <h2>Ready for the next chapter?</h2>
          <p className="muted">
            Record completion and a replacement date. The previous cycle remains
            in the audit trail.
          </p>
          <Button
            disabled={renewal.status === "archived"}
            onClick={() => {
              setError("");
              setDialog("renew");
            }}
          >
            Mark renewed
          </Button>
          <Button
            disabled={renewal.status === "archived"}
            variant="secondary"
            onClick={() => {
              setError("");
              setDialog("archive");
            }}
          >
            Archive renewal
          </Button>
          <p className="small muted" style={{ marginTop: 18 }}>
            No emails are sent or scheduled yet.
          </p>
        </Card>
      </div>
      <Notice title="Your stored record">
        Changes are scoped to your owner workspace. Archiving retains the record
        and history.
      </Notice>
      <Dialog
        open={!!dialog}
        onClose={() => {
          if (!pending) setDialog(null);
        }}
        title={dialog === "renew" ? "Mark renewed" : "Archive this renewal?"}
      >
        {dialog === "renew" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              void mutate({
                version: renewal.version,
                dueDate: data.get("dueDate"),
                notes: String(data.get("notes") ?? ""),
              });
            }}
          >
            <p>
              Confirm that the current obligation has been renewed. Choose the
              next due date after {formatDate(renewal.dueDate)}.
            </p>
            <div className="field">
              <label htmlFor="replacement-date">Replacement due date *</label>
              <input
                id="replacement-date"
                name="dueDate"
                type="date"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="completion-notes">Completion notes</label>
              <textarea
                id="completion-notes"
                name="notes"
                rows={3}
                maxLength={2000}
              />
            </div>
            <div className="dialog-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Confirm renewal"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <p>
              This retains the record and audit history, and invalidates
              existing future jobs. It does not delete your data.
            </p>
            <div className="dialog-actions">
              <Button
                variant="secondary"
                disabled={pending}
                onClick={() => setDialog(null)}
              >
                Cancel
              </Button>
              <Button
                disabled={pending}
                onClick={() => void mutate({ version: renewal.version })}
              >
                {pending ? "Archiving…" : "Confirm archive"}
              </Button>
            </div>
          </>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
      </Dialog>
    </>
  );
}
