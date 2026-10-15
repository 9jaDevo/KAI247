import { createHash, createHmac, randomBytes } from "node:crypto";
import { sealData, unsealData } from "iron-session";
import { ObjectId } from "mongodb";
import { collections, ensureIndexes } from "../db/client.ts";
import { AppError } from "../security/errors.ts";
import { validateEnv } from "../security/env.ts";
import { verifyPassword, hashPassword } from "./password.ts";
import { loginSchema } from "../renewals/validation.ts";
import type { OwnerContext, User } from "../../types/domain.ts";

export const SESSION_COOKIE = "kai247_session";
const TTL_SECONDS = 3600;
interface SessionData {
  userId: string;
  token: string;
  expiresAt: number;
}
const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export function getSessionCookie(headers: Headers) {
  const raw = headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  try {
    return raw ? decodeURIComponent(raw) : "";
  } catch {
    return "";
  }
}
export async function readSessionCookie(
  cookie: string,
): Promise<Partial<SessionData>> {
  if (!cookie || cookie.length > 4096) return {};
  const env = validateEnv(process.env, ["auth"]);
  try {
    return await unsealData<SessionData>(cookie, {
      password: env.AUTH_SECRET!,
      ttl: TTL_SECONDS,
    });
  } catch {
    return {};
  }
}
export async function authenticate(request: Request): Promise<OwnerContext> {
  const data = await readSessionCookie(getSessionCookie(request.headers));
  if (
    !data.userId ||
    !/^[a-f0-9]{24}$/.test(data.userId) ||
    typeof data.token !== "string" ||
    !/^[a-f0-9]{64}$/.test(data.token) ||
    typeof data.expiresAt !== "number" ||
    data.expiresAt <= Date.now()
  )
    throw new AppError(401, "UNAUTHORIZED", "Sign in to your owner account.");
  const c = await collections();
  const userId = new ObjectId(data.userId);
  const session = await c.sessions.findOne({
    _id: digest(data.token),
    userId,
    expiresAt: { $gt: new Date() },
  });
  if (!session)
    throw new AppError(
      401,
      "UNAUTHORIZED",
      "Your session expired. Sign in again.",
    );
  const [user, organization] = await Promise.all([
    c.users.findOne({ _id: userId }),
    c.organizations.findOne({ ownerUserId: userId }),
  ]);
  if (!user || !organization)
    throw new AppError(401, "UNAUTHORIZED", "Sign in to your owner account.");
  return { user, organization };
}
export async function issueSession(user: User) {
  const env = validateEnv(process.env, ["auth"]);
  await ensureIndexes();
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
  await (
    await collections()
  ).sessions.insertOne({
    _id: digest(token),
    userId: user._id,
    createdAt: new Date(),
    expiresAt,
  });
  const sealed = await sealData(
    { userId: user._id.toHexString(), token, expiresAt: expiresAt.valueOf() },
    { password: env.AUTH_SECRET!, ttl: TTL_SECONDS },
  );
  return `${SESSION_COOKIE}=${encodeURIComponent(sealed)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TTL_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
export async function revokeSession(request: Request) {
  const data = await readSessionCookie(getSessionCookie(request.headers));
  if (typeof data.token === "string" && /^[a-f0-9]{64}$/.test(data.token))
    await (await collections()).sessions.deleteOne({ _id: digest(data.token) });
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
let dummyHash: Promise<string> | undefined;
export async function checkCredentials(input: unknown) {
  const data = loginSchema.parse(input);
  const env = validateEnv(process.env, ["auth"]);
  await ensureIndexes();
  const c = await collections();
  // Shared datastore limit; no trust in spoofable forwarding headers, no raw emails in limiter keys.
  const bucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const globalKey = createHmac("sha256", env.AUTH_SECRET!)
    .update(`${bucket}:global-login-budget`)
    .digest("hex");
  const globalLimit = await c.loginLimits.findOneAndUpdate(
    { _id: globalKey },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * 15 * 60 * 1000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if ((globalLimit?.count ?? 0) > 200)
    throw new AppError(
      429,
      "TOO_MANY_ATTEMPTS",
      "Sign-in is temporarily rate limited. Try again later.",
    );
  const key = createHmac("sha256", env.AUTH_SECRET!)
    .update(`${bucket}:${data.email}`)
    .digest("hex");
  const limit = await c.loginLimits.findOneAndUpdate(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((bucket + 1) * 15 * 60 * 1000) },
    },
    { upsert: true, returnDocument: "after" },
  );
  if ((limit?.count ?? 0) > 10)
    throw new AppError(
      429,
      "TOO_MANY_ATTEMPTS",
      "Too many sign-in attempts. Try again in 15 minutes.",
    );
  const user = await c.users.findOne({ email: data.email });
  dummyHash ??= hashPassword(randomBytes(32).toString("hex"));
  const fallbackHash = await dummyHash;
  const valid = await verifyPassword(
    data.password,
    user?.passwordHash ?? fallbackHash,
  );
  if (!user || !valid)
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Email or password is incorrect.",
    );
  await c.users.updateOne(
    { _id: user._id },
    { $set: { lastLoginAt: new Date() } },
  );
  return user;
}
