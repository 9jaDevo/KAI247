import { MongoClient } from "mongodb";
import { validateEnv } from "../security/env.ts";
import type {
  User,
  Organization,
  Renewal,
  Extraction,
  ReminderJob,
  AuditEvent,
  SessionRecord,
  LoginLimit,
  RateLimit,
  EmailVerification,
} from "../../types/domain.ts";

const globalDb = globalThis as typeof globalThis & {
  kai247Mongo?: {
    key: string;
    client: MongoClient;
    ready: Promise<MongoClient>;
  };
  kai247Indexes?: Promise<void>;
};
export async function getClient() {
  const env = validateEnv(process.env, ["db"]);
  const key = `${env.MONGODB_URI}:${env.MONGODB_DB}`;
  if (!globalDb.kai247Mongo || globalDb.kai247Mongo.key !== key) {
    const client = new MongoClient(env.MONGODB_URI!, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    const ready = client.connect().catch((error) => {
      globalDb.kai247Mongo = undefined;
      globalDb.kai247Indexes = undefined;
      throw error;
    });
    globalDb.kai247Mongo = { key, client, ready };
    globalDb.kai247Indexes = undefined;
  }
  return globalDb.kai247Mongo.ready;
}
export async function collections() {
  const db = (await getClient()).db(
    validateEnv(process.env, ["db"]).MONGODB_DB!,
  );
  return {
    users: db.collection<User>("users"),
    organizations: db.collection<Organization>("organizations"),
    renewals: db.collection<Renewal>("renewals"),
    extractions: db.collection<Extraction>("extractions"),
    reminderJobs: db.collection<ReminderJob>("reminderJobs"),
    auditEvents: db.collection<AuditEvent>("auditEvents"),
    sessions: db.collection<SessionRecord>("sessions"),
    loginLimits: db.collection<LoginLimit>("loginLimits"),
    rateLimits: db.collection<RateLimit>("rateLimits"),
    emailVerifications: db.collection<EmailVerification>("emailVerifications"),
  };
}
export async function ensureIndexes() {
  if (!globalDb.kai247Indexes)
    globalDb.kai247Indexes = (async () => {
      const c = await collections();
      await Promise.all([
        c.users.createIndex({ email: 1 }, { unique: true }),
        c.organizations.createIndex({ ownerUserId: 1 }, { unique: true }),
        c.renewals.createIndex({ organizationId: 1, dueDate: 1, status: 1 }),
        c.auditEvents.createIndex({
          organizationId: 1,
          entityId: 1,
          createdAt: -1,
        }),
        c.reminderJobs.createIndex({
          status: 1,
          nextAttemptAt: 1,
          scheduledForUtc: 1,
        }),
        c.reminderJobs.createIndex({ idempotencyKey: 1 }, { unique: true }),
        c.extractions.createIndex({ organizationId: 1, createdAt: -1 }),
        c.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        c.loginLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        c.rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        c.emailVerifications.createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 },
        ),
        c.emailVerifications.createIndex({ organizationId: 1, userId: 1 }),
        c.reminderJobs.createIndex({ organizationId: 1, createdAt: -1 }),
        c.extractions.createIndex(
          { renewalId: 1 },
          {
            unique: true,
            partialFilterExpression: { renewalId: { $exists: true } },
          },
        ),
      ]);
    })().catch((error) => {
      globalDb.kai247Indexes = undefined;
      throw error;
    });
  await globalDb.kai247Indexes;
}
export async function closeDatabase() {
  await globalDb.kai247Mongo?.client.close();
  globalDb.kai247Mongo = undefined;
  globalDb.kai247Indexes = undefined;
}
