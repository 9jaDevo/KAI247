import { ActionLink, EmptyState } from "@/components/ui";
export default function MissingRenewal() {
  return (
    <EmptyState
      title="Renewal not found"
      description="This record is unavailable in your owner workspace."
    >
      <ActionLink href="/app/renewals">Back to renewals</ActionLink>
    </EmptyState>
  );
}
