import { notFound } from "next/navigation";
import { RenewalDetail } from "@/components/renewal-detail";
import { pageOwner } from "@/lib/auth/owner";
import { getRenewal } from "@/lib/renewals/service";
import { AppError } from "@/lib/security/errors";
import { safeLoad } from "@/lib/security/safe-load";
export default async function RenewalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await pageOwner();
  const id = (await params).id;
  const data = await safeLoad(() => getRenewal(ctx, id)).catch((error) => {
    if (error instanceof AppError && [400, 404].includes(error.status))
      notFound();
    throw error;
  });
  return <RenewalDetail renewal={data.renewal} history={data.history} />;
}
