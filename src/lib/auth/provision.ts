import { ObjectId } from "mongodb";
import { z } from "zod";
import { collections, ensureIndexes, getClient } from "../db/client.ts";
import { hashPassword } from "./password.ts";
import type { User, Organization } from "../../types/domain.ts";
export async function provisionOwner(input: {
  email: string;
  password: string;
  displayName: string;
  organizationName: string;
  isDemo: boolean;
}) {
  const data = z
    .strictObject({
      email: z
        .string()
        .email()
        .max(254)
        .transform((value) => value.toLowerCase()),
      password: z.string().min(12).max(128),
      displayName: z.string().trim().min(1).max(100),
      organizationName: z.string().trim().min(1).max(120),
      isDemo: z.boolean(),
    })
    .parse(input);
  if (data.isDemo && !data.email.endsWith(".invalid"))
    throw new Error(
      "Synthetic owners must use an example.invalid email address.",
    );
  await ensureIndexes();
  const now = new Date();
  const user: User = {
    _id: new ObjectId(),
    email: data.email,
    passwordHash: await hashPassword(data.password),
    displayName: data.displayName,
    createdAt: now,
    lastLoginAt: null,
    isDemo: data.isDemo,
  };
  const organization: Organization = {
    _id: new ObjectId(),
    ownerUserId: user._id,
    name: data.organizationName,
    timezone: "Africa/Lagos",
    verifiedNotificationEmail: null,
    emailOptIn: false,
    reminderOffsetsDays: [30, 7, 1, 0],
    reminderLocalTime: "09:00",
    createdAt: now,
    updatedAt: now,
    isDemo: data.isDemo,
  };
  await (
    await getClient()
  ).withSession(async (session) =>
    session.withTransaction(async () => {
      const c = await collections();
      await c.users.insertOne(user, { session });
      await c.organizations.insertOne(organization, { session });
    }),
  );
  return { user, organization };
}
