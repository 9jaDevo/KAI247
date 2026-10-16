import { traceStep } from "../observability/telemetry.ts";
import { ObjectId, type ClientSession } from "mongodb";
import type { OwnerContext, Renewal } from "../../types/domain.ts";
import { collections } from "../db/client.ts";
import { planReminders } from "./planner.ts";
import { z } from "zod";
export interface ReminderPlanResult {
  status: "scheduled" | "disabled";
  jobsCreated: number;
  message: string;
}
export function eligibleOwner(ctx: OwnerContext) {
  return (
    ctx.organization.emailOptIn &&
    ctx.organization.verifiedNotificationEmail === ctx.user.email &&
    z.email().safeParse(ctx.user.email).success &&
    !/@.*\.invalid$/i.test(ctx.user.email)
  );
}
export async function planInitialReminders(
  ctx: OwnerContext,
  renewal: Renewal,
  session: ClientSession,
  now = new Date(),
): Promise<ReminderPlanResult> {
  return traceStep(
    "queue_reminder",
    { synthetic: ctx.user.isDemo },
    async (annotate) => {
      const c = await collections();
      const org = await c.organizations.findOne(
        { _id: ctx.organization._id, ownerUserId: ctx.user._id },
        { session },
      );
      if (
        !org ||
        !eligibleOwner({ ...ctx, organization: org }) ||
        renewal.status !== "active"
      ) {
        annotate({ outcome: "disabled", jobs_created: 0 });
        return {
          status: "disabled",
          jobsCreated: 0,
          message:
            "No jobs: verified owner email and explicit opt-in are required.",
        };
      }
      await c.organizations.updateOne(
        { _id: org._id },
        { $inc: { schedulingFence: 1 } },
        { session },
      );
      const plans = planReminders(
        renewal.dueDate,
        org.timezone,
        org.reminderOffsetsDays,
        org.reminderLocalTime,
        now,
      );
      let jobsCreated = 0;
      for (const plan of plans) {
        if (
          await c.reminderJobs.findOne(
            {
              renewalId: renewal._id,
              organizationId: org._id,
              renewalVersion: renewal.version,
              offsetDays: plan.offsetDays,
              attemptCount: { $gt: 0 },
            },
            { session },
          )
        )
          continue;
        if (
          plan.immediate &&
          (await c.reminderJobs.findOne(
            {
              renewalId: renewal._id,
              organizationId: org._id,
              renewalVersion: renewal.version,
              immediate: true,
              attemptCount: { $gt: 0 },
            },
            { session },
          ))
        )
          continue;
        const idempotencyKey = `${org._id}:${renewal._id}:${renewal.version}:email:${plan.offsetDays}:s${org.notificationRevision ?? 0}`;
        const result = await c.reminderJobs.updateOne(
          { idempotencyKey },
          {
            $setOnInsert: {
              _id: new ObjectId(),
              organizationId: org._id,
              renewalId: renewal._id,
              renewalVersion: renewal.version,
              channel: "email",
              kind: "renewal",
              offsetDays: plan.offsetDays,
              scheduledForUtc: plan.scheduledForUtc,
              idempotencyKey,
              status: "pending",
              attemptCount: 0,
              nextAttemptAt: plan.scheduledForUtc,
              createdAt: now,
              updatedAt: now,
              settingsRevision: org.notificationRevision ?? 0,
              immediate: plan.immediate,
              recipientEmail: ctx.user.email,
            },
          },
          { upsert: true, session },
        );
        jobsCreated += result.upsertedCount;
      }
      if (jobsCreated)
        await c.auditEvents.insertOne(
          {
            _id: new ObjectId(),
            organizationId: org._id,
            actorUserId: ctx.user._id,
            entityType: "renewal",
            entityId: renewal._id,
            action: "reminders_planned",
            changesSummary: `${jobsCreated} email jobs planned; no delivery claimed.`,
            createdAt: now,
          },
          { session },
        );
      annotate({ jobs_created: jobsCreated, outcome: "scheduled" });
      return {
        status: "scheduled",
        jobsCreated,
        message: `${jobsCreated} reminder jobs added. Delivery requires the separate worker and configured provider.`,
      };
    },
  );
}
