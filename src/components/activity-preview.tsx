"use client";
import { useState } from "react";
import {
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Notice,
  PageHeader,
  Pill,
  PreviewStateControl,
} from "./ui";
import type { PreviewState } from "@/types/preview";

const events = [
  [
    "Website hosting",
    "21 Oct 2026 · 09:00 WAT",
    "Pending",
    "0",
    "Not attempted",
  ],
  [
    "Business domain",
    "1 Nov 2026 · 09:00 WAT",
    "Provider accepted",
    "1",
    "Synthetic 202 response",
  ],
  [
    "Delivery van insurance",
    "10 Oct 2026 · 09:00 WAT",
    "Failed",
    "2",
    "Synthetic timeout",
  ],
  [
    "Equipment service agreement",
    "2 Oct 2026 · 09:00 WAT",
    "Cancelled",
    "0",
    "Sample replaced renewal",
  ],
];
export function ActivityPreview() {
  const [state, setState] = useState<PreviewState>("sample");
  return (
    <>
      <PageHeader
        eyebrow="A RECORD OF WHAT HAPPENED"
        title="Reminders, with a paper trail."
        description="The planned activity view keeps attempts, outcomes and failures visible."
      />
      <Notice title="Email delivery is not connected">
        The entries below illustrate future notification states. No email has
        been attempted, accepted or delivered by this app.
      </Notice>
      <PreviewStateControl value={state} onChange={setState} />
      <Card>
        <div className="card-header">
          <div>
            <h2>Notification activity</h2>
            <p className="muted">Synthetic examples · email channel only</p>
          </div>
          <Pill>Preview</Pill>
        </div>
        {state === "loading" ? (
          <LoadingState />
        ) : state === "error" ? (
          <ErrorState onRetry={() => setState("sample")} />
        ) : state === "empty" ? (
          <EmptyState
            title="No notification activity yet"
            description="When email delivery is implemented, your authorized reminder attempts will appear here."
            icon="bell"
          />
        ) : (
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Synthetic notification activity; scroll horizontally on small screens"
          >
            <table className="activity-table">
              <caption>
                Illustrative statuses only. No real provider results.
              </caption>
              <thead>
                <tr>
                  {[
                    "Renewal / channel",
                    "Scheduled for",
                    "Sample status",
                    "Attempts",
                    "Sample outcome",
                  ].map((title) => (
                    <th scope="col" key={title}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.map(([title, date, status, attempts, outcome]) => (
                  <tr key={title}>
                    <td>
                      <strong>{title}</strong>
                      <span className="table-subtitle">
                        Email · synthetic owner
                      </span>
                    </td>
                    <td>{date}</td>
                    <td>
                      <Pill
                        tone={
                          status === "Failed"
                            ? "red"
                            : status === "Provider accepted"
                              ? "teal"
                              : "neutral"
                        }
                      >
                        {status}
                      </Pill>
                    </td>
                    <td>{attempts}</td>
                    <td>{outcome}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="activity-help">
          <span>
            <strong>Accepted ≠ delivered.</strong> A provider accepting a
            request does not prove inbox delivery.
          </span>
          <span>Live scheduling and audit history arrive in P4.</span>
        </div>
      </Card>
    </>
  );
}
