import { RenewalList } from "@/components/renewal-list";
import { pageOwner } from "@/lib/auth/owner";
import { listRenewals } from "@/lib/renewals/service";
import { safeLoad } from "@/lib/security/safe-load";
export default async function RenewalsPage() {
  const ctx = await pageOwner();
  return <RenewalList initialItems={await safeLoad(() => listRenewals(ctx))} />;
}
