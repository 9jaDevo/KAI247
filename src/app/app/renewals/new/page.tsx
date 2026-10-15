import { RenewalForm } from "@/components/renewal-form";
import { pageOwner } from "@/lib/auth/owner";
export default async function NewRenewalPage() {
  const ctx = await pageOwner();
  return <RenewalForm timezone={ctx.organization.timezone} />;
}
