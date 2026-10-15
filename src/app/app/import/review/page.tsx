import { redirect } from "next/navigation";
// The P1 illustrative review was replaced by real stored extractions at /app/import/[id].
export default function LegacyReviewPage() {
  redirect("/app/import");
}
