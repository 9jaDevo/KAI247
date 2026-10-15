import { ObjectId, type ClientSession } from "mongodb";
import { z } from "zod";
import { collections, ensureIndexes, getClient } from "../db/client.ts";
import { AppError } from "../security/errors.ts";
import {
  createRenewalSchema,
  updateRenewalSchema,
  renewSchema,
  archiveSchema,
  settingsSchema,
  categories,
} from "./validation.ts";
import { renewalView } from "./dates.ts";
import { planInitialReminders } from "../notifications/hooks.ts";
import type {
  OwnerContext,
  Renewal,
  OrganizationView,
} from "../../types/domain.ts";

export function objectId(value: string) {
  if (!/^[a-fA-F0-9]{24}$/.test(value))
    throw new AppError(400, "INVALID_ID", "Invalid record identifier.");
  return new ObjectId(value);
}
export function organizationView(ctx: OwnerContext): OrganizationView {
  const {
    _id,
    ownerUserId: _owner,
    createdAt: _created,
    updatedAt: _updated,
    ...fields
  } = ctx.organization;
  void _owner;
  void _created;
  void _updated;
  return { ...fields, id: _id.toHexString() };
}
export async function audit(
  ctx: OwnerContext,
  id: ObjectId,
  action: string,
  summary: string,
  session: ClientSession,
  entityType: "renewal" | "organization" | "extraction" = "renewal",
) {
  await (
    await collections()
  ).auditEvents.insertOne(
    {
      _id: new ObjectId(),
      organizationId: ctx.organization._id,
      actorUserId: ctx.user._id,
      entityType,
      entityId: id,
      action,
      changesSummary: summary,
      createdAt: new Date(),
    },
    { session },
  );
}
const listSchema = z.strictObject({
  q: z.string().max(120).default(""),
  category: z.enum(["all", ...categories]).default("all"),
  status: z
    .enum([
      "all",
      "active",
      "renewed",
      "archived",
      "due_soon",
      "overdue",
      "upcoming",
      "completed",
    ])
    .default("all"),
});
export async function listRenewals(
  ctx: OwnerContext,
  query: Record<string, string | undefined> = {},
) {
  const parsed = listSchema.parse(query);
  const c = await collections();
  const filter: import("mongodb").Filter<Renewal> = {
    organizationId: ctx.organization._id,
  };
  if (parsed.category !== "all") filter.category = parsed.category;
  if (["active", "renewed", "archived"].includes(parsed.status))
    filter.status = parsed.status as Renewal["status"];
  else filter.status = { $ne: "archived" };
  if (parsed.status === "completed") filter.completedAt = { $exists: true };
  if (parsed.q.trim()) {
    const term = parsed.q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { title: { $regex: term, $options: "i" } },
      { provider: { $regex: term, $options: "i" } },
      { responsibleLabel: { $regex: term, $options: "i" } },
    ];
  }
  const records = (
    await c.renewals
      .find(filter)
      .sort({ dueDate: 1, _id: 1 })
      .limit(500)
      .toArray()
  ).map((item) =>
    renewalView({ ...item, timezone: ctx.organization.timezone }),
  );
  const statuses: Record<string, string> = {
    due_soon: "Due soon",
    overdue: "Overdue",
    upcoming: "Upcoming",
  };
  const desired = statuses[parsed.status];
  return desired
    ? records.filter((item) => item.displayStatus === desired)
    : records;
}
export async function dashboard(ctx: OwnerContext) {
  const c = await collections();
  const records = await c.renewals
    .find({ organizationId: ctx.organization._id, status: { $ne: "archived" } })
    .toArray();
  const views = records.map((item) =>
    renewalView({ ...item, timezone: ctx.organization.timezone }),
  );
  return {
    total: views.length,
    dueSoon: views.filter((item) => item.displayStatus === "Due soon").length,
    overdue: views.filter((item) => item.displayStatus === "Overdue").length,
    completed: views.filter((item) => !!item.completedAt).length,
    items: views
      .filter((item) => item.status === "active")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 8),
  };
}
export async function getRenewal(ctx: OwnerContext, id: string) {
  const c = await collections();
  const recordId = objectId(id);
  const item = await c.renewals.findOne({
    _id: recordId,
    organizationId: ctx.organization._id,
  });
  if (!item) throw new AppError(404, "NOT_FOUND", "Renewal not found.");
  const events = await c.auditEvents
    .find({
      organizationId: ctx.organization._id,
      entityId: recordId,
      entityType: "renewal",
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
  return {
    renewal: renewalView({ ...item, timezone: ctx.organization.timezone }),
    history: events.map((event) => ({
      id: event._id.toHexString(),
      action: event.action,
      changesSummary: event.changesSummary,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}
export function requireWorkspaceTimezone(ctx: OwnerContext, timezone: string) {
  if (timezone !== ctx.organization.timezone)
    throw new AppError(
      400,
      "TIMEZONE_MISMATCH",
      "Use the workspace timezone. Change it in Settings first.",
    );
}
export async function createRenewal(ctx: OwnerContext, input: unknown) {
  const data = createRenewalSchema.parse(input);
  requireWorkspaceTimezone(ctx, data.timezone);
  await ensureIndexes();
  const now = new Date();
  const item: Renewal = {
    ...data,
    _id: new ObjectId(),
    organizationId: ctx.organization._id,
    dateSource: "manual",
    status: "active",
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
  await (
    await getClient()
  ).withSession(async (session) =>
    session.withTransaction(async () => {
      await (await collections()).renewals.insertOne(item, { session });
      await planInitialReminders(ctx, item, session);
      await audit(
        ctx,
        item._id,
        "created",
        "Manual renewal created; date confirmed by owner.",
        session,
      );
    }),
  );
  return renewalView(item);
}
export async function updateRenewal(
  ctx: OwnerContext,
  id: string,
  input: unknown,
) {
  const { version, ...data } = updateRenewalSchema.parse(input);
  requireWorkspaceTimezone(ctx, data.timezone);
  const recordId = objectId(id);
  let updated: Renewal | null = null;
  await (
    await getClient()
  ).withSession(async (session) =>
    session.withTransaction(async () => {
      const c = await collections();
      const existing = await c.renewals.findOne(
        { _id: recordId, organizationId: ctx.organization._id },
        { session },
      );
      if (!existing) throw new AppError(404, "NOT_FOUND", "Renewal not found.");
      if (existing.status === "archived")
        throw new AppError(
          409,
          "ARCHIVED",
          "Archived renewals cannot be edited.",
        );
      const unset: Record<string, ""> = {};
      for (const key of [
        "amountMinor",
        "currency",
        "provider",
        "assetIdentifier",
        "responsibleLabel",
        "notes",
      ])
        if (!(key in data)) unset[key] = "";
      updated = await c.renewals.findOneAndUpdate(
        { _id: recordId, organizationId: ctx.organization._id, version },
        {
          $set: { ...data, updatedAt: new Date() },
          $inc: { version: 1 },
          ...(Object.keys(unset).length ? { $unset: unset } : {}),
        },
        { returnDocument: "after", session },
      );
      if (!updated)
        throw new AppError(
          409,
          "VERSION_CONFLICT",
          "This renewal changed. Reload before editing.",
        );
      await c.reminderJobs.updateMany(
        {
          organizationId: ctx.organization._id,
          renewalId: recordId,
          status: { $in: ["pending", "claimed"] },
        },
        { $set: { status: "cancelled", updatedAt: new Date() } },
        { session },
      );
      await audit(
        ctx,
        recordId,
        "updated",
        "Renewal fields updated; obsolete future reminder jobs invalidated.",
        session,
      );
      await planInitialReminders(ctx, updated!, session);
    }),
  );
  return renewalView(updated!);
}
export async function renewRenewal(
  ctx: OwnerContext,
  id: string,
  input: unknown,
) {
  const data = renewSchema.parse(input);
  const recordId = objectId(id);
  let updated: Renewal | null = null;
  await (
    await getClient()
  ).withSession(async (session) =>
    session.withTransaction(async () => {
      const c = await collections();
      const current = await c.renewals.findOne(
        { _id: recordId, organizationId: ctx.organization._id },
        { session },
      );
      if (!current) throw new AppError(404, "NOT_FOUND", "Renewal not found.");
      if (current.status === "archived")
        throw new AppError(
          409,
          "ARCHIVED",
          "Archived renewals cannot be renewed.",
        );
      if (data.dueDate <= current.dueDate)
        throw new AppError(
          400,
          "INVALID_REPLACEMENT_DATE",
          "The replacement date must be after the previous due date.",
        );
      const now = new Date();
      updated = await c.renewals.findOneAndUpdate(
        {
          _id: recordId,
          organizationId: ctx.organization._id,
          version: data.version,
        },
        {
          $set: {
            dueDate: data.dueDate,
            status: "active",
            renewedAt: now,
            completedAt: now,
            updatedAt: now,
            ...(data.notes !== undefined ? { notes: data.notes } : {}),
          },
          $inc: { version: 1 },
        },
        { returnDocument: "after", session },
      );
      if (!updated)
        throw new AppError(
          409,
          "VERSION_CONFLICT",
          "This renewal changed. Reload before renewing.",
        );
      await c.reminderJobs.updateMany(
        {
          organizationId: ctx.organization._id,
          renewalId: recordId,
          status: { $in: ["pending", "claimed"] },
        },
        { $set: { status: "cancelled", updatedAt: now } },
        { session },
      );
      await audit(
        ctx,
        recordId,
        "renewed",
        `Previous cycle completed; due date ${current.dueDate} replaced with ${data.dueDate}. Future jobs invalidated.`,
        session,
      );
      await planInitialReminders(ctx, updated!, session);
    }),
  );
  return renewalView(updated!);
}
export async function archiveRenewal(
  ctx: OwnerContext,
  id: string,
  input: unknown,
) {
  const { version } = archiveSchema.parse(input);
  const recordId = objectId(id);
  let updated: Renewal | null = null;
  await (
    await getClient()
  ).withSession(async (session) =>
    session.withTransaction(async () => {
      const c = await collections();
      if (
        !(await c.renewals.findOne(
          { _id: recordId, organizationId: ctx.organization._id },
          { session },
        ))
      )
        throw new AppError(404, "NOT_FOUND", "Renewal not found.");
      updated = await c.renewals.findOneAndUpdate(
        { _id: recordId, organizationId: ctx.organization._id, version },
        {
          $set: { status: "archived", updatedAt: new Date() },
          $inc: { version: 1 },
        },
        { returnDocument: "after", session },
      );
      if (!updated)
        throw new AppError(
          409,
          "VERSION_CONFLICT",
          "This renewal changed. Reload before archiving.",
        );
      await c.reminderJobs.updateMany(
        {
          organizationId: ctx.organization._id,
          renewalId: recordId,
          status: { $in: ["pending", "claimed"] },
        },
        { $set: { status: "cancelled", updatedAt: new Date() } },
        { session },
      );
      await audit(
        ctx,
        recordId,
        "archived",
        "Renewal archived; future jobs invalidated. No data deleted.",
        session,
      );
    }),
  );
  return renewalView(updated!);
}
export async function updateSettings(ctx: OwnerContext, input: unknown) {
  const data = settingsSchema.parse(input);
  if (data.emailOptIn && !ctx.organization.verifiedNotificationEmail)
    throw new AppError(
      400,
      "EMAIL_UNVERIFIED",
      "Email opt-in requires a verified owner address. Verify the owner address in Settings first.",
    );
  await (
    await getClient()
  ).withSession(async (session) =>
    session.withTransaction(async () => {
      const c = await collections();
      const previous = await c.organizations.findOne(
        { _id: ctx.organization._id, ownerUserId: ctx.user._id },
        { session },
      );
      if (!previous)
        throw new AppError(404, "NOT_FOUND", "Workspace unavailable.");
      if (
        data.emailOptIn &&
        previous.verifiedNotificationEmail !== ctx.user.email
      )
        throw new AppError(
          400,
          "EMAIL_UNVERIFIED",
          "Verify your own address before opting in.",
        );
      await c.organizations.updateOne(
        { _id: ctx.organization._id, ownerUserId: ctx.user._id },
        { $set: { ...data, updatedAt: new Date() } },
        { session },
      );
      const changed =
        previous.timezone !== data.timezone ||
        data.emailOptIn !== previous.emailOptIn ||
        data.reminderLocalTime !== previous.reminderLocalTime ||
        JSON.stringify([...data.reminderOffsetsDays].sort()) !==
          JSON.stringify([...previous.reminderOffsetsDays].sort());
      if (!changed) return;
      await c.organizations.updateOne(
        { _id: ctx.organization._id },
        { $inc: { notificationRevision: 1 } },
        { session },
      );
      if (data.timezone !== previous.timezone)
        await c.renewals.updateMany(
          { organizationId: ctx.organization._id },
          {
            $set: { timezone: data.timezone, updatedAt: new Date() },
            $inc: { version: 1 },
          },
          { session },
        );
      await c.reminderJobs.updateMany(
        {
          organizationId: ctx.organization._id,
          status: { $in: ["pending", "claimed"] },
        },
        { $set: { status: "cancelled", updatedAt: new Date() } },
        { session },
      );
      const active = await c.renewals
        .find(
          { organizationId: ctx.organization._id, status: "active" },
          { session },
        )
        .toArray();
      for (const item of active) await planInitialReminders(ctx, item, session);
      await audit(
        ctx,
        ctx.organization._id,
        "settings_updated",
        "Workspace preferences updated; date-only values retained and future jobs invalidated.",
        session,
        "organization",
      );
    }),
  );
  return { ...organizationView(ctx), ...data };
}
