import { DocumentImport } from "@/components/document-import";
import { pageOwner } from "@/lib/auth/owner";
import { gemmaStatus } from "@/lib/ai/gemma";
import { listExtractions } from "@/lib/extractions/service";
import { safeLoad } from "@/lib/security/safe-load";

export default async function ImportPage() {
  const ctx = await pageOwner();
  const recent = await safeLoad(() => listExtractions(ctx));
  return <DocumentImport ai={gemmaStatus()} recent={recent} />;
}
