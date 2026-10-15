import { notFound } from "next/navigation";
import { ExtractionReview } from "@/components/extraction-review";
import { pageOwner } from "@/lib/auth/owner";
import { getExtraction } from "@/lib/extractions/service";
import { AppError } from "@/lib/security/errors";
import { safeLoad } from "@/lib/security/safe-load";

export default async function ExtractionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await pageOwner();
  const id = (await params).id;
  const extraction = await safeLoad(() => getExtraction(ctx, id)).catch(
    (error) => {
      if (error instanceof AppError && [400, 404].includes(error.status))
        notFound();
      throw error;
    },
  );
  return (
    <ExtractionReview
      key={`${extraction.id}:${extraction.validationStatus}`}
      extraction={extraction}
      timezone={ctx.organization.timezone}
    />
  );
}
