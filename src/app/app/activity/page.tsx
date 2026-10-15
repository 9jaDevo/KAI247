import { Card, EmptyState, Notice, PageHeader } from "@/components/ui";
import { pageOwner } from "@/lib/auth/owner";
import { collections } from "@/lib/db/client";
export default async function ActivityPage() {
  const ctx = await pageOwner();
  const jobs = await (await collections()).reminderJobs
    .find({ organizationId: ctx.organization._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();
  return (
    <>
      <PageHeader
        eyebrow="NOTIFICATION HISTORY"
        title="Reminders, with a paper trail."
        description="Only stored notification jobs for your workspace appear here."
      />
      <Notice title="Auditable scheduling and attempts">
        The one-shot worker processes eligible jobs. Provider accepted means
        accepted for processing, not delivered. No delivery receipt integration
        is configured.
      </Notice>
      <Card>
        {jobs.length ? (
          <div
            className="table-wrap"
            tabIndex={0}
            role="region"
            aria-label="Stored notification jobs"
          >
            <table>
              <caption>Stored jobs only; accepted is not delivered</caption>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Scheduled for</th>
                  <th>Attempts</th>
                  <th>Result / safe error</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id.toHexString()}>
                    <td>
                      {job.kind === "test" ? "TEST · " : ""}
                      {job.status}
                    </td>
                    <td>
                      {job.scheduledForUtc.toLocaleString("en-GB", {
                        timeZone: ctx.organization.timezone,
                      })}
                    </td>
                    <td>
                      {job.attemptCount}
                      {job.attempts?.map((a, i) => (
                        <p className="small" key={i}>
                          {a.at.toISOString()} · {a.outcome}
                          {a.code ? ` · ${a.code}` : ""}
                        </p>
                      ))}
                    </td>
                    <td>
                      {job.lastErrorCode ??
                        (job.providerMessageId
                          ? "Provider accepted; receipt unverified"
                          : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No notification activity yet"
            description="No reminder jobs have been scheduled for your workspace. Manual renewal history appears on each renewal’s detail page."
            icon="bell"
          />
        )}
      </Card>
    </>
  );
}
