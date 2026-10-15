import Link from "next/link";
import type { PreviewRenewal } from "@/types/preview";
import {
  categoryLabels,
  formatPreviewDate,
  formatPreviewAmount,
} from "@/lib/renewals/preview-fixtures";
import { Pill } from "./ui";

export function RenewalStatus({
  status,
}: {
  status: PreviewRenewal["status"];
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
export function RenewalTable({ items }: { items: PreviewRenewal[] }) {
  return (
    <>
      <div className="table-wrap desktop-records">
        <table>
          <caption>
            Synthetic example records · Statuses fixed at 14 Oct 2026
          </caption>
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
                    {item.provider} · {categoryLabels[item.category]}
                  </span>
                  <span className="table-subtitle">
                    {item.owner} · {item.source} (sample)
                  </span>
                </td>
                <td className="date-cell">{formatPreviewDate(item.dueDate)}</td>
                <td>{formatPreviewAmount(item)}</td>
                <td>
                  <RenewalStatus status={item.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-records" aria-label="Synthetic renewal records">
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
                <span className="table-subtitle">{item.provider}</span>
              </div>
              <RenewalStatus status={item.status} />
            </div>
            <span className="table-subtitle">
              {categoryLabels[item.category]} · {item.source} (sample)
            </span>
            <span className="table-subtitle">{item.owner}</span>
            <div className="record-card-bottom">
              <span>{formatPreviewDate(item.dueDate)}</span>
              <strong>{formatPreviewAmount(item)}</strong>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
