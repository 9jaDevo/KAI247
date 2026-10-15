"use client";
import { Button, EmptyState } from "@/components/ui";
export default function WorkspaceError({ retry }: { retry: () => void }) {
  return (
    <EmptyState
      title="This screen couldn’t load"
      description="Please retry loading your owner workspace. Saved changes remain in your database."
      icon="shield"
    >
      <Button onClick={retry}>Try again</Button>
    </EmptyState>
  );
}
