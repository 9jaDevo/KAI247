import { renewalGet, renewalPatch, renewalDelete } from "@/lib/api/routes";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: Request, context: Context) {
  return renewalGet(request, (await context.params).id);
}
export async function PATCH(request: Request, context: Context) {
  return renewalPatch(request, (await context.params).id);
}
export async function DELETE(request: Request, context: Context) {
  return renewalDelete(request, (await context.params).id);
}
