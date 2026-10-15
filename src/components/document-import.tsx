"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icon";
import { Button, Card, Notice, PageHeader, Pill } from "./ui";
import { dateStatusLabels, reviewLabels } from "@/lib/extractions/labels";
import type { ExtractionView } from "@/types/domain";

type AiStatus =
  | { configured: true; modelId: string; provider: string }
  | { configured: false; code: string; message: string };
interface RecentExtraction {
  id: string;
  originalFilename: string;
  createdAt: string;
  validationStatus: ExtractionView["validationStatus"];
  dateStatus: ExtractionView["candidateFields"]["date"]["status"];
  serviceTitle: string | null;
  modelId: string;
  renewalId?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

export function DocumentImport({
  ai,
  recent,
}: {
  ai: AiStatus;
  recent: RecentExtraction[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!pending) return;
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [pending]);

  function choose(selected: File | undefined) {
    setFile(selected ?? null);
    setError(
      !selected
        ? ""
        : selected.size > MAX_BYTES
          ? "This file exceeds 5 MB. Choose a smaller file."
          : !["application/pdf", "text/plain"].includes(selected.type)
            ? "Unsupported file. Choose a machine-readable PDF or a TXT file."
            : "",
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || error || !ai.configured) return;
    setSeconds(0);
    setPending(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/extractions", {
        method: "POST",
        body,
        cache: "no-store",
      });
      if (response.status === 401) {
        window.location.assign(new URL("/login", window.location.origin).href);
        return;
      }
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success)
        throw new Error(
          result?.error?.message ??
            "The extraction failed. Nothing was saved; please retry.",
        );
      router.push(`/app/import/${result.data.id}`);
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The extraction failed. Nothing was saved; please retry.",
      );
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="DOCUMENT → REVIEW → CONFIRM"
        title="Find the date. Keep the context."
        description="Upload a machine-readable invoice, certificate or notice. Gemma proposes a candidate with quoted evidence; nothing is saved as a renewal until you confirm it."
      />
      {ai.configured ? (
        <Notice title={`Live extraction with ${ai.modelId}`}>
          Document text is sent to the open-weight Gemma model hosted at{" "}
          {ai.provider}. Use synthetic or permitted documents only. The original
          file is not stored; only its fingerprint, filename and short evidence
          excerpts are kept for review.
        </Notice>
      ) : (
        <Notice title="Gemma extraction is unavailable" tone="warning">
          {ai.message} No fallback model or rule-based guess is used. You can
          still <Link href="/app/renewals/new">add a renewal manually</Link>.
        </Notice>
      )}
      <div className="import-grid">
        <Card>
          <form className="card-content" onSubmit={submit}>
            <div className="import-progress" aria-label="Import steps">
              <span className="current">
                <b>1</b>Document
              </span>
              <span>
                <b>2</b>Human review
              </span>
              <span>
                <b>3</b>Confirmation
              </span>
            </div>
            <div className="upload-box">
              <Icon name="upload" width="32" height="32" />
              <h2>A document with a date to check.</h2>
              <p className="muted">
                Machine-readable PDF or TXT · up to 5 MB · up to 30 pages
              </p>
              <div className="field">
                <label htmlFor="document-file">Choose a document</label>
                <input
                  ref={input}
                  id="document-file"
                  name="file"
                  type="file"
                  accept="application/pdf,text/plain,.pdf,.txt"
                  disabled={pending || !ai.configured}
                  aria-invalid={!!error}
                  aria-describedby="file-note file-error"
                  onChange={(event) => choose(event.target.files?.[0])}
                />
                <span id="file-note" className="field-help">
                  Checked again on the server: type, signature, size and text
                  layer. Scanned PDFs without text are rejected; OCR is not
                  supported.
                </span>
                <p
                  id="file-error"
                  className="field-error"
                  role={error ? "alert" : undefined}
                >
                  {error}
                </p>
              </div>
            </div>
            {pending && (
              <div
                className="extraction-progress"
                role="status"
                aria-live="polite"
              >
                <span className="spinner" aria-hidden="true" />
                <div>
                  <strong>Reading the text and asking Gemma…</strong>
                  <span className="small muted">
                    {seconds}s elapsed. Real model calls usually take several
                    seconds. Evidence is checked before anything is shown.
                  </span>
                </div>
              </div>
            )}
            <div className="actions">
              <Button
                type="submit"
                disabled={!file || !!error || pending || !ai.configured}
              >
                {pending ? "Extracting…" : "Extract with Gemma"}
              </Button>
              {file && !pending && (
                <Button
                  type="button"
                  variant="quiet"
                  onClick={() => {
                    choose(undefined);
                    if (input.current) input.current.value = "";
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </form>
        </Card>
        <Card className="form-guide">
          <h2>Useful dates need evidence.</h2>
          <p>
            Invoices often carry an issue date, a payment date and a renewal
            date. Each candidate must quote the document word for word.
          </p>
          <ol>
            <li>Evidence that isn’t in the document is discarded.</li>
            <li>DD/MM vs MM/DD ambiguity is shown, never guessed.</li>
            <li>Only your confirmation creates a renewal.</li>
          </ol>
          <p style={{ marginTop: 18 }}>
            KAI247 never calculates statutory or CAC filing deadlines. This is
            not legal advice.
          </p>
        </Card>
      </div>
      <Card className="recent-extractions">
        <div className="card-header">
          <div>
            <h2>Recent extractions</h2>
            <p className="muted">
              Stored candidates in your workspace, newest first.
            </p>
          </div>
        </div>
        {recent.length === 0 ? (
          <p className="card-content muted">
            No documents have been analysed yet.
          </p>
        ) : (
          <ul className="extraction-list">
            {recent.map((item) => (
              <li key={item.id}>
                <div>
                  <Link href={`/app/import/${item.id}`}>
                    <strong>
                      {item.serviceTitle || item.originalFilename}
                    </strong>
                  </Link>
                  <span className="small muted">
                    {item.originalFilename} ·{" "}
                    {new Date(item.createdAt).toLocaleString("en-GB")} ·{" "}
                    {item.modelId}
                  </span>
                </div>
                <div className="pill-row">
                  <Pill tone={dateStatusLabels[item.dateStatus][1]}>
                    {dateStatusLabels[item.dateStatus][0]}
                  </Pill>
                  <Pill tone={reviewLabels[item.validationStatus][1]}>
                    {reviewLabels[item.validationStatus][0]}
                  </Pill>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
