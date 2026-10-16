import { AppError } from "./errors.ts";
export const BODY_TIMEOUT_MS = 15_000;
/** One total deadline (not a fresh deadline per chunk); caps slow streaming bodies. */
export async function readRequestBytes(
  request: Request,
  limit: number,
  tooLarge: AppError,
  empty: AppError,
) {
  if (Number(request.headers.get("content-length") ?? 0) > limit)
    throw tooLarge;
  const reader = request.body?.getReader();
  if (!reader) throw empty;
  const chunks: Uint8Array[] = [];
  let size = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new AppError(
            408,
            "BODY_TIMEOUT",
            "The request took too long. Please retry.",
          ),
        ),
      BODY_TIMEOUT_MS,
    );
  });
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.length;
      if (size > limit) throw tooLarge;
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    // Do not await an untrusted producer's cancellation callback.
    void reader.cancel().catch(() => undefined);
    throw error;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
