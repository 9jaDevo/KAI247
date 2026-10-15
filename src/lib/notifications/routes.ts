import { authenticate } from "../auth/session.ts";
import {
  apiResponse,
  assertMutationOrigin,
  readJson,
} from "../security/http.ts";
import {
  requestVerification,
  confirmVerification,
  sendTest,
  previewReminder,
} from "./service.ts";
import { z } from "zod";
export async function verificationPost(request: Request) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    const ctx = await authenticate(request);
    z.strictObject({}).parse(await readJson(request));
    return requestVerification(ctx);
  });
}
export async function verificationConfirm(request: Request) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return confirmVerification(
      await authenticate(request),
      await readJson(request),
    );
  });
}
export async function testPost(request: Request) {
  return apiResponse(async () => {
    assertMutationOrigin(request);
    return sendTest(await authenticate(request), await readJson(request));
  });
}
export async function previewGet(request: Request) {
  return apiResponse(async () => {
    await authenticate(request);
    return previewReminder();
  });
}
