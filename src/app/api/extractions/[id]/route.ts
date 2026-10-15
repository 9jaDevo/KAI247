import { extractionGet } from "@/lib/api/routes";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return extractionGet(request, (await context.params).id);
}
