import { renewalRenew } from "@/lib/api/routes";
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return renewalRenew(request, (await context.params).id);
}
