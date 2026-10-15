"use client";
import { useState } from "react";
import { Icon } from "./icon";
import { ActionLink, Button, Card, EmptyState, PageHeader } from "./ui";
import { StoredRenewalTable } from "./stored-renewal-table";
import { clientApi } from "@/lib/client-api";
import { categoryNames } from "@/lib/renewals/dates";
import type { RenewalView } from "@/types/domain";
export function RenewalList({ initialItems }: { initialItems: RenewalView[] }) {
  const [items, setItems] = useState(initialItems);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function search(q: string, c: string, s: string) {
    setPending(true);
    setError("");
    try {
      setItems(
        await clientApi<RenewalView[]>(
          `/api/renewals?${new URLSearchParams({ q, category: c, status: s })}`,
        ),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not load records.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow="YOUR RENEWAL REGISTER"
        title="Every date, in one place."
        description="Search your stored renewals by title, provider or responsible person."
        actions={
          <ActionLink href="/app/renewals/new">
            <Icon name="plus" />
            New renewal
          </ActionLink>
        }
      />
      <Card>
        <form
          className="filters"
          onSubmit={(e) => {
            e.preventDefault();
            void search(query, category, status);
          }}
        >
          <div className="field">
            <label htmlFor="renewal-search">Search renewals</label>
            <input
              id="renewal-search"
              type="search"
              value={query}
              maxLength={120}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a renewal…"
            />
          </div>
          <div className="field">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {Object.entries(categoryNames).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {[
                ["all", "All current records"],
                ["active", "Active"],
                ["due_soon", "Due soon"],
                ["overdue", "Overdue"],
                ["upcoming", "Upcoming"],
                ["completed", "Previously renewed"],
                ["archived", "Archived"],
              ].map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="actions">
            <Button type="submit" disabled={pending}>
              {pending ? "Loading…" : "Apply filters"}
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setStatus("all");
                void search("", "all", "all");
              }}
            >
              Clear filters
            </Button>
          </div>
        </form>
        {error ? (
          <div role="alert" className="notice notice-warning">
            {error}
          </div>
        ) : items.length ? (
          <StoredRenewalTable items={items} />
        ) : (
          <EmptyState
            title="No matching renewals"
            description="Add a confirmed date or adjust your filters."
          >
            <ActionLink href="/app/renewals/new">Add a renewal</ActionLink>
          </EmptyState>
        )}
        <p className="table-note" aria-live="polite">
          {items.length} stored record{items.length === 1 ? "" : "s"} · Maximum
          500 results per search. Archived records are retained.
        </p>
      </Card>
    </>
  );
}
