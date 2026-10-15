import Link from "next/link";
import { Icon } from "./icon";
import { ActionLink, Card, EmptyState, PageHeader, Pill } from "./ui";
import { StoredRenewalTable } from "./stored-renewal-table";
import type { RenewalView } from "@/types/domain";
export function Dashboard({
  data,
  timezone,
  aiConfigured,
  emailConfigured,
}: {
  data: {
    total: number;
    dueSoon: number;
    overdue: number;
    completed: number;
    items: RenewalView[];
  };
  timezone: string;
  aiConfigured: boolean;
  emailConfigured: boolean;
}) {
  return (
    <>
      <PageHeader
        eyebrow="YOUR CONFIRMED RENEWALS"
        title="A clearer view of what’s next."
        description={`Current dates in ${timezone}. Counts come from your stored workspace records.`}
        actions={
          <>
            <ActionLink variant="secondary" href="/app/import">
              <Icon name="upload" />
              Import document
            </ActionLink>
            <ActionLink href="/app/renewals/new">
              <Icon name="plus" />
              New renewal
            </ActionLink>
          </>
        }
      />
      <div className="stats-grid">
        {[
          ["Tracked renewals", data.total],
          ["Due in 30 days", data.dueSoon],
          ["Overdue", data.overdue],
          ["Completed renewals", data.completed],
        ].map(([label, value]) => (
          <Card
            key={label}
            className={`stat ${label === "Overdue" ? "stat-warning" : ""}`}
          >
            <div className="stat-header">{label}</div>
            <p className="stat-number">{value}</p>
            <p className="stat-note">
              Stored owner records
              {label === "Completed renewals"
                ? " · items renewed at least once"
                : ""}
            </p>
          </Card>
        ))}
      </div>
      <div className="dashboard-grid">
        <Card>
          <div className="card-header">
            <div>
              <h2>On the horizon</h2>
              <p className="muted">Active records ordered by due date</p>
            </div>
            <Link className="text-link" href="/app/renewals">
              View all <Icon name="arrow" width="16" />
            </Link>
          </div>
          {data.items.length ? (
            <StoredRenewalTable items={data.items} />
          ) : (
            <EmptyState
              title="Start with one renewal"
              description="Add a confirmed hosting, insurance or agreement date."
            >
              <ActionLink href="/app/renewals/new">Add a renewal</ActionLink>
            </EmptyState>
          )}
        </Card>
        <Card className="status-summary">
          <h2>Connection status</h2>
          <div className="connection-row">
            <span>Owner authentication</span>
            <Pill tone="teal">Signed in</Pill>
          </div>
          <div className="connection-row">
            <span>MongoDB persistence</span>
            <Pill tone="teal">Connected</Pill>
          </div>
          <div className="connection-row">
            <span>Gemma extraction</span>
            {aiConfigured ? (
              <Pill tone="teal">Configured · review required</Pill>
            ) : (
              <Pill>Not configured</Pill>
            )}
          </div>
          <div className="connection-row">
            <span>Email reminders</span>
            <Pill>
              {emailConfigured
                ? "Requires verified opt-in"
                : "Provider unavailable"}
            </Pill>
          </div>
          <p className="small muted" style={{ marginTop: 14 }}>
            Only owner-confirmed records are persisted as renewals. Email
            requires verified opt-in and the separate reminder worker.
          </p>
        </Card>
      </div>
    </>
  );
}
