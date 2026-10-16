import { afterEach, describe, expect, it, vi } from "vitest";
import { readJson } from "../../src/lib/security/http.ts";
import { readDocumentUpload } from "../../src/lib/documents/upload.ts";
import { BODY_TIMEOUT_MS } from "../../src/lib/security/body.ts";
afterEach(() => vi.useRealTimers());
function stalled(type: string) {
  let cancelled = false;
  const request = new Request("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "content-type": type },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(" "));
      },
      cancel() {
        cancelled = true;
      },
    }),
    duplex: "half",
  } as RequestInit);
  return { request, cancelled: () => cancelled };
}
describe("request streaming deadlines", () => {
  it.each(["json", "multipart"])(
    "cancels a stalled %s body with 408",
    async (kind) => {
      vi.useFakeTimers();
      const input = stalled(
        kind === "json"
          ? "application/json"
          : "multipart/form-data; boundary=x",
      );
      const result = (
        kind === "json"
          ? readJson(input.request)
          : readDocumentUpload(input.request)
      ).catch((error) => error);
      await vi.advanceTimersByTimeAsync(BODY_TIMEOUT_MS);
      expect(await result).toMatchObject({ status: 408, code: "BODY_TIMEOUT" });
      expect(input.cancelled()).toBe(true);
    },
  );
  it("keeps existing JSON size and syntax guards", async () => {
    await expect(
      readJson(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "x".repeat(32769),
        }),
      ),
    ).rejects.toMatchObject({ status: 413 });
    await expect(
      readJson(
        new Request("http://localhost", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{bad",
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
  });
});
