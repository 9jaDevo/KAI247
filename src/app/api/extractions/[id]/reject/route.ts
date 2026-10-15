import { extractionReject } from "@/lib/api/routes";
type Context = { params: Promise<{ id: string }> };
export async function POST(request: Request, context: Context) {
  return extractionReject(request, (await context.params).id);
}
