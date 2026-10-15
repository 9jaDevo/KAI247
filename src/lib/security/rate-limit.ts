import { createHmac } from "node:crypto";
import { collections } from "../db/client.ts";
import { AppError } from "./errors.ts";
import { validateEnv } from "./env.ts";

/**
 * Shared fixed-window counter stored in MongoDB (works across processes).
 * Keys are HMACs, so raw identifiers never appear in the limiter collection.
 */
export async function consumeRateLimit(
  scope: string,
  subject: string,
  limit: number,
  windowMs: number,
  message: string,
) {
  const env = validateEnv(process.env, ["auth"]);
  const bucket = Math.floor(Date.now() / windowMs);
  const key = createHmac("sha256", env.AUTH_SECRET!)
    .update(`${scope}:${bucket}:${subject}`)
    .digest("hex");
  const result = await (
    await collections()
  ).rateLimits.findOneAndUpdate(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * windowMs) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if ((result?.count ?? 0) > limit)
    throw new AppError(429, "RATE_LIMITED", message);
}
