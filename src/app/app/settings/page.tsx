import { SettingsPreview } from "@/components/settings-preview";
import { pageOwner } from "@/lib/auth/owner";
import { organizationView } from "@/lib/renewals/service";
import { gemmaStatus } from "@/lib/ai/gemma";
import { emailStatus } from "@/lib/notifications/provider";
export default async function SettingsPage() {
  const ctx = await pageOwner();
  return (
    <SettingsPreview
      organization={organizationView(ctx)}
      ownerEmail={ctx.user.email}
      aiConfigured={gemmaStatus().configured}
      emailConfigured={emailStatus().configured}
    />
  );
}
