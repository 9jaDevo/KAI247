import { traceStep } from "../observability/telemetry.ts";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { ObjectId, type Filter } from "mongodb";
import { collections, getClient, ensureIndexes } from "../db/client.ts";
import type { ReminderJob } from "../../types/domain.ts";
import { eligibleOwner } from "./jobs.ts";
import {
  emailStatus,
  reminderMessage,
  sendEmail,
  type EmailTransport,
} from "./provider.ts";
export const MAX_ATTEMPTS = 5;
export const LEASE_MS = 120000;
const RETRY_WINDOW_MS = 20 * 60 * 60 * 1000;
export async function claimJob(now = new Date(), onlyId?: ObjectId) {
  const c = await collections();
  let claimed: ReminderJob | null = null;
  await (
    await getClient()
  ).withSession((session) =>
    session.withTransaction(async () => {
      claimed = null;
      const filter: Filter<ReminderJob> = {
        ...(onlyId ? { _id: onlyId } : {}),
        scheduledForUtc: { $lte: now },
        nextAttemptAt: { $lte: now },
        $or: [
          { status: "pending" },
          { status: "claimed", leaseUntil: { $lte: now } },
        ],
      };
      const job = await c.reminderJobs.findOne(filter, {
        session,
        sort: { scheduledForUtc: -1, _id: 1 },
      });
      if (!job) return;
      const group = {
        organizationId: job.organizationId,
        renewalId: job.renewalId,
      };
      if (
        await c.reminderJobs.findOne(
          {
            ...group,
            _id: { $ne: job._id },
            status: "claimed",
            leaseUntil: { $gt: now },
          },
          { session },
        )
      )
        return;
      if (job.kind === "test")
        await c.organizations.updateOne(
          { _id: job.organizationId },
          { $inc: { dispatchFence: 1 } },
          { session },
        );
      else
        await c.renewals.updateOne(
          { _id: job.renewalId, organizationId: job.organizationId },
          { $inc: { dispatchFence: 1 } },
          { session },
        );
      if (
        job.attemptCount >= MAX_ATTEMPTS ||
        (job.firstAttemptAt &&
          now.getTime() - job.firstAttemptAt.getTime() > RETRY_WINDOW_MS)
      ) {
        await c.reminderJobs.updateOne(
          { _id: job._id },
          {
            $set: {
              status: "failed",
              lastErrorCode: "RETRY_BUDGET_EXHAUSTED",
              updatedAt: now,
            },
          },
          { session },
        );
        return;
      }
      claimed = await c.reminderJobs.findOneAndUpdate(
        { _id: job._id },
        {
          $set: {
            status: "claimed",
            claimedAt: now,
            leaseUntil: new Date(now.getTime() + LEASE_MS),
            leaseToken: randomUUID(),
            firstAttemptAt: job.firstAttemptAt ?? now,
            updatedAt: now,
          },
          $inc: { attemptCount: 1 },
          $push: { attempts: { at: now, outcome: "attempted" } },
        },
        { returnDocument: "after", session },
      );
      if (job.kind !== "test")
        await c.reminderJobs.updateMany(
          {
            ...group,
            _id: { $ne: job._id },
            renewalVersion: job.renewalVersion,
            status: "pending",
            scheduledForUtc: { $lte: now },
          },
          {
            $set: {
              status: "cancelled",
              lastErrorCode: "COALESCED_MISSED_OFFSETS",
              updatedAt: now,
            },
          },
          { session },
        );
    }),
  );
  return claimed as ReminderJob | null;
}
export async function processClaim(
  job: ReminderJob,
  transport: EmailTransport = sendEmail,
  now = new Date(),
) {
  const c = await collections();
  const ownership = {
    _id: job._id,
    status: "claimed" as const,
    leaseToken: job.leaseToken,
    leaseUntil: { $gt: now },
  };
  const finish = async (
    status: ReminderJob["status"],
    code?: string,
    extra: Record<string, unknown> = {},
  ) => {
    const saved = await c.reminderJobs.updateOne(ownership, {
      $set: {
        status,
        updatedAt: now,
        ...(code ? { lastErrorCode: code } : {}),
        ...extra,
      },
      $unset: {
        leaseToken: "",
        leaseUntil: "",
        ...(status === "provider_accepted"
          ? { lastErrorCode: "" as const }
          : {}),
      },
      $push: {
        attempts: { at: now, outcome: status, ...(code ? { code } : {}) },
      },
    });
    if (!saved.matchedCount && status === "provider_accepted") {
      // An opt-out/edit can win while HTTP is in flight. Preserve that cancellation,
      // but record the actual provider outcome without reactivating obsolete work.
      await c.reminderJobs.updateOne(
        { _id: job._id },
        {
          $push: {
            attempts: {
              at: now,
              outcome: "provider_accepted_after_invalidation",
            },
          },
          $set: { providerMessageId: String(extra.providerMessageId) },
        },
      );
    }
  };
  if (!(await c.reminderJobs.findOne(ownership))) return;
  const org = await c.organizations.findOne({ _id: job.organizationId });
  const user = org && (await c.users.findOne({ _id: org.ownerUserId }));
  if (
    user &&
    (!z.email().safeParse(user.email).success ||
      /@.*\.invalid$/i.test(user.email))
  ) {
    await finish("failed", "INVALID_RECIPIENT");
    return;
  }
  const renewal =
    job.kind === "test"
      ? null
      : await c.renewals.findOne({
          _id: job.renewalId,
          organizationId: job.organizationId,
        });
  if (
    !org ||
    !user ||
    !eligibleOwner({ organization: org, user }) ||
    org.verifiedNotificationEmail !== job.recipientEmail ||
    (org.notificationRevision ?? 0) !== (job.settingsRevision ?? 0) ||
    (job.kind !== "test" &&
      (!renewal ||
        renewal.status !== "active" ||
        renewal.version !== job.renewalVersion))
  ) {
    await finish("cancelled", "OBSOLETE_OR_NOT_OPTED_IN");
    return;
  }
  const payload = job.payload ?? {
    from: process.env.EMAIL_FROM ?? "",
    to: [user.email],
    ...reminderMessage(
      renewal?.title ?? "",
      renewal?.dueDate ?? "",
      org.timezone,
      job.kind === "test",
    ),
  };
  const saved = await c.reminderJobs.updateOne(ownership, {
    $set: { payload },
  });
  if (!saved.matchedCount || !(await c.reminderJobs.findOne(ownership))) return;
  let result;
  try {
    result = await traceStep(
      "send_email",
      { attempt: job.attemptCount, synthetic: transport !== sendEmail },
      async (annotate) => {
        const outcome = await transport(payload, job.idempotencyKey);
        annotate({
          outcome: outcome.accepted ? "provider_accepted" : "provider_rejected",
          ...(!outcome.accepted
            ? { error_code: outcome.code, retryable: outcome.retryable }
            : {}),
        });
        return outcome;
      },
    );
  } catch {
    result = {
      accepted: false as const,
      code: "PROVIDER_NETWORK",
      retryable: true,
    };
  }
  if (result.accepted)
    await finish("provider_accepted", undefined, {
      providerMessageId: result.id,
    });
  else {
    const retry =
      result.retryable &&
      job.attemptCount < MAX_ATTEMPTS &&
      now.getTime() - (job.firstAttemptAt ?? now).getTime() < RETRY_WINDOW_MS;
    const delay = Math.max(
      60000 * 2 ** (job.attemptCount - 1),
      result.retryAfterMs ?? 0,
    );
    await finish(
      retry ? "pending" : "failed",
      result.code,
      retry ? { nextAttemptAt: new Date(now.getTime() + delay) } : {},
    );
  }
}
export async function processBatch(
  options: {
    limit?: number;
    transport?: EmailTransport;
    now?: Date;
    onlyId?: ObjectId;
  } = {},
) {
  return traceStep("reminder_batch", {}, async (annotate) => {
    if (!options.transport && !emailStatus().configured) {
      annotate({ provider_unavailable: true, processed: 0 });
      return { processed: 0, providerUnavailable: true };
    }
    await ensureIndexes();
    let processed = 0;
    for (let i = 0; i < Math.min(Math.max(options.limit ?? 25, 1), 100); i++) {
      const job = await claimJob(options.now ?? new Date(), options.onlyId);
      if (!job) break;
      await processClaim(job, options.transport, options.now ?? new Date());
      processed++;
      if (options.onlyId) break;
    }
    annotate({ processed, provider_unavailable: false });
    return { processed, providerUnavailable: false };
  });
}
