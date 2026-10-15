import { Dashboard } from "@/components/dashboard";
import { pageOwner } from "@/lib/auth/owner";
import { dashboard } from "@/lib/renewals/service";
import { safeLoad } from "@/lib/security/safe-load";
import { gemmaStatus } from "@/lib/ai/gemma";
import { emailStatus } from "@/lib/notifications/provider";
export default async function DashboardPage() {
  const ctx = await pageOwner();
  return (
    <Dashboard
      data={await safeLoad(() => dashboard(ctx))}
      timezone={ctx.organization.timezone}
      aiConfigured={gemmaStatus().configured}
      emailConfigured={emailStatus().configured}
    />
  );
}
