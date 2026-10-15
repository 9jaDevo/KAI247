import { AppShell } from "@/components/app-shell";
import { pageOwner } from "@/lib/auth/owner";
export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await pageOwner();
  return (
    <AppShell
      organization={{
        name: ctx.organization.name,
        timezone: ctx.organization.timezone,
        isDemo: ctx.organization.isDemo,
      }}
      displayName={ctx.user.displayName}
    >
      {children}
    </AppShell>
  );
}
