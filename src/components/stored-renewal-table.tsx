import Link from "next/link";
import { Pill } from "./ui";
import { categoryNames, formatDate, formatAmount } from "@/lib/renewals/dates";
import type { RenewalView } from "@/types/domain";
export function StoredStatus({
  status,
}: {
  status: RenewalView["displayStatus"];
}) {
  return (
    <Pill
      tone={
        status === "Overdue"
          ? "red"
          : status === "Due soon"
            ? "amber"
            : status === "Renewed"
              ? "teal"
              : "neutral"
      }
    >
      {status}
    </Pill>
  );
}
export function StoredRenewalTable({ items }: { items: RenewalView[] }) {
  return (
    <>
      <div className="table-wrap desktop-records">
        <table>
          <caption>Confirmed records from your owner workspace</caption>
          <thead>
            <tr>
              <th scope="col">Renewal / provider</th>
              <th scope="col">Due date</th>
              <th scope="col">Amount</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link
                    className="renewal-title"
                    href={`/app/renewals/${item.id}`}
                  >
                    {item.title}
                  </Link>
                  <span className="table-subtitle">
                    {item.provider || "No provider"} ·{" "}
                    {categoryNames[item.category]}
                  </span>
                  <span className="table-subtitle">
                    {item.responsibleLabel || "Owner"} ·{" "}
                    {item.dateSource === "manual"
                      ? "Manual"
                      : "Document confirmed"}
                    {item.completedAt ? " · Previous cycle renewed" : ""}
                  </span>
                </td>
                <td className="date-cell">{formatDate(item.dueDate)}</td>
                <td>{formatAmount(item)}</td>
                <td>
                  <StoredStatus status={item.displayStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-records">
        {items.map((item) => (
          <article className="record-card" key={item.id}>
            <div className="record-card-top">
              <div>
                <Link
                  className="renewal-title"
                  href={`/app/renewals/${item.id}`}
                >
                  {item.title}
                </Link>
                <span className="table-subtitle">
                  {item.provider || categoryNames[item.category]}
                </span>
              </div>
              <StoredStatus status={item.displayStatus} />
            </div>
            <span className="table-subtitle">
              {item.dateSource === "manual" ? "Manual" : "Document confirmed"} ·{" "}
              {item.responsibleLabel || "Owner"}
            </span>
            {item.completedAt && (
              <span className="table-subtitle">Previous cycle renewed</span>
            )}
            <div className="record-card-bottom">
              <span>{formatDate(item.dueDate)}</span>
              <strong>{formatAmount(item)}</strong>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
