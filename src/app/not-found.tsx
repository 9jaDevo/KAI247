import { ActionLink, EmptyState } from "@/components/ui";
export default function NotFound() {
  return (
    <main>
      <EmptyState
        title="That page isn’t here"
        description="Return to the landing page to explore the KAI247 AI preview."
      >
        <ActionLink href="/">Back to home</ActionLink>
      </EmptyState>
    </main>
  );
}
