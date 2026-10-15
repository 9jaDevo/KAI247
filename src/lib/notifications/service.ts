import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { collections, ensureIndexes, getClient } from "../db/client.ts";
import { consumeRateLimit } from "../security/rate-limit.ts";
import { AppError } from "../security/errors.ts";
import { audit } from "../renewals/service.ts";
import type { OwnerContext, ReminderJob } from "../../types/domain.ts";
import { eligibleOwner } from "./jobs.ts";
import {
  emailStatus,
  reminderMessage,
  sendEmail,
  type EmailTransport,
} from "./provider.ts";
import { processBatch } from "./worker.ts";
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export function previewReminder() {
  return {
    ...reminderMessage(
      "Synthetic domain renewal",
      "2027-06-15",
      "Africa/Lagos",
      true,
    ),
    delivers: false,
    label: "NON-DELIVERING PREVIEW — no email sent",
  };
}
export async function requestVerification(
  ctx: OwnerContext,
  transport: EmailTransport = sendEmail,
) {
  await consumeRateLimit(
    "email-verification-send",
    ctx.user._id.toHexString(),
    3,
    3600000,
    "Verification request limit reached. Try again later.",
  );
  if (!emailStatus().configured && transport === sendEmail)
    throw new AppError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Email provider unavailable. No verification email sent.",
    );
  if (
    !z.email().safeParse(ctx.user.email).success ||
    /@.*\.invalid$/i.test(ctx.user.email)
  )
    throw new AppError(
      400,
      "INVALID_RECIPIENT",
      "Synthetic .invalid addresses cannot receive email. Use a private owner account.",
    );
  await ensureIndexes();
  const c = await collections();
  const now = new Date();
  const code = randomBytes(24).toString("base64url");
  const id = new ObjectId();
  await c.emailVerifications.deleteMany({
    organizationId: ctx.organization._id,
    userId: ctx.user._id,
  });
  await c.emailVerifications.insertOne({
    _id: id,
    organizationId: ctx.organization._id,
    userId: ctx.user._id,
    email: ctx.user.email,
    digest: digest(code),
    createdAt: now,
    expiresAt: new Date(now.getTime() + 15 * 60000),
  });
  const result = await transport(
    {
      from: process.env.EMAIL_FROM ?? "",
      to: [ctx.user.email],
      subject: "KAI247 owner email verification",
      text: `KAI247 AI\n\nPaste this verification code into Settings while signed in:\n\n${code}\n\nExpires in 15 minutes. This verifies your own address only; reminders remain off until you explicitly opt in.`,
    },
    `verify:${id}`,
  );
  if (!result.accepted) {
    await c.emailVerifications.deleteOne({ _id: id });
    throw new AppError(
      503,
      "VERIFICATION_NOT_ACCEPTED",
      "Provider did not accept the verification email. Retry later.",
    );
  }
  return {
    providerAccepted: true,
    message:
      "Verification email accepted by provider. Check your inbox; acceptance is not delivery.",
  };
}
export async function confirmVerification(ctx: OwnerContext, input: unknown) {
  const { code } = z
    .strictObject({ code: z.string().min(20).max(100) })
    .parse(input);
  await consumeRateLimit(
    "email-verification-confirm",
    ctx.user._id.toHexString(),
    10,
    900000,
    "Too many verification attempts.",
  );
  const c = await collections();
  await (
    await getClient()
  ).withSession((session) =>
    session.withTransaction(async () => {
      const proof = await c.emailVerifications.findOneAndDelete(
        {
          organizationId: ctx.organization._id,
          userId: ctx.user._id,
          email: ctx.user.email,
          digest: digest(code),
          expiresAt: { $gt: new Date() },
        },
        { session },
      );
      if (!proof)
        throw new AppError(
          400,
          "INVALID_VERIFICATION",
          "Verification code is invalid or expired.",
        );
      await c.organizations.updateOne(
        { _id: ctx.organization._id, ownerUserId: ctx.user._id },
        {
          $set: {
            verifiedNotificationEmail: ctx.user.email,
            emailOptIn: false,
            updatedAt: new Date(),
          },
          $inc: { notificationRevision: 1 },
        },
        { session },
      );
      await c.reminderJobs.updateMany(
        {
          organizationId: ctx.organization._id,
          status: { $in: ["pending", "claimed"] },
        },
        {
          $set: {
            status: "cancelled",
            lastErrorCode: "EMAIL_REVERIFIED",
            updatedAt: new Date(),
          },
        },
        { session },
      );
      await audit(
        ctx,
        ctx.organization._id,
        "owner_email_verified",
        "Mailbox possession verified; opt-in remains off.",
        session,
        "organization",
      );
    }),
  );
  return {
    verified: true,
    message:
      "Owner address verified. Explicitly enable reminders and save preferences.",
  };
}
export async function sendTest(
  ctx: OwnerContext,
  input: unknown,
  transport?: EmailTransport,
) {
  const { confirm } = z.strictObject({ confirm: z.literal(true) }).parse(input);
  void confirm;
  await consumeRateLimit(
    "test-email",
    ctx.organization._id.toHexString(),
    1,
    600000,
    "One test email is allowed per ten minutes.",
  );
  if (!eligibleOwner(ctx))
    throw new AppError(
      400,
      "EMAIL_NOT_READY",
      "Verify your own email and explicitly opt in before sending a TEST.",
    );
  if (!transport && !emailStatus().configured)
    throw new AppError(
      503,
      "PROVIDER_UNAVAILABLE",
      "Email provider unavailable. Preview does not send.",
    );
  await ensureIndexes();
  const now = new Date();
  const id = new ObjectId();
  const c = await collections();
  const job: ReminderJob = {
    _id: id,
    organizationId: ctx.organization._id,
    renewalId: ctx.organization._id,
    renewalVersion: 0,
    kind: "test",
    channel: "email",
    offsetDays: 0,
    scheduledForUtc: now,
    nextAttemptAt: now,
    idempotencyKey: `test:${id}`,
    status: "pending",
    attemptCount: 0,
    settingsRevision: ctx.organization.notificationRevision ?? 0,
    recipientEmail: ctx.user.email,
    createdAt: now,
    updatedAt: now,
  };
  await (
    await getClient()
  ).withSession((session) =>
    session.withTransaction(async () => {
      await c.reminderJobs.insertOne(job, { session });
      await audit(
        ctx,
        ctx.organization._id,
        "test_email_requested",
        "Owner explicitly requested a TEST email; no due date changed.",
        session,
        "organization",
      );
    }),
  );
  await processBatch({ onlyId: id, transport });
  const result = await c.reminderJobs.findOne({ _id: id });
  return {
    jobId: id.toHexString(),
    status: result!.status,
    message:
      "TEST request recorded. Provider accepted does not mean delivered.",
  };
}
