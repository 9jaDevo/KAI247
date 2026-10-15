import { extractionConfirm } from "@/lib/api/routes";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  return extractionConfirm(request, (await context.params).id);
}
