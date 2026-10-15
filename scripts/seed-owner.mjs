import { provisionOwner } from "../src/lib/auth/provision.ts";
import { collections, closeDatabase } from "../src/lib/db/client.ts";
import { createRenewal } from "../src/lib/renewals/service.ts";
import { todayInTimezone, addCalendarDays } from "../src/lib/renewals/dates.ts";
try {
  const email = process.env.SEED_OWNER_EMAIL;
  const password = process.env.SEED_OWNER_PASSWORD;
  const mode = process.env.SEED_OWNER_MODE;
  if (!email || !password || !["synthetic", "private"].includes(mode ?? ""))
    throw new Error(
      "Set SEED_OWNER_EMAIL, SEED_OWNER_PASSWORD and explicit SEED_OWNER_MODE=synthetic or private in ignored .env.local.",
    );
  if (
    await (await collections()).users.findOne({ email: email.toLowerCase() })
  ) {
    console.log("Owner already exists. Password and records left unchanged.");
  } else {
    const ctx = await provisionOwner({
      email,
      password,
      displayName: mode === "synthetic" ? "Synthetic owner" : "Owner",
      organizationName:
        mode === "synthetic"
          ? "Synthetic sandbox"
          : process.env.SEED_WORKSPACE_NAME || "Owner workspace",
      isDemo: mode === "synthetic",
    });
    if (mode === "synthetic") {
      const today = todayInTimezone(ctx.organization.timezone);
      for (const item of [
        {
          title: "Synthetic hosting renewal",
          category: "digital_infrastructure",
          dueDate: addCalendarDays(today, 7),
          amountMinor: 8500000,
        },
        {
          title: "Synthetic vehicle policy",
          category: "vehicle",
          dueDate: addCalendarDays(today, -2),
          amountMinor: 12500000,
        },
      ])
        await createRenewal(ctx, {
          ...item,
          currency: "NGN",
          dateType: "renewal",
          timezone: ctx.organization.timezone,
          provider: "Example provider",
          responsibleLabel: "Synthetic owner",
        });
    }
    console.log(
      "Owner provisioned with a hashed password and an isolated workspace. No credentials printed. Synthetic records added only in synthetic mode.",
    );
  }
} catch (error) {
  console.error(
    error?.message?.startsWith("Set SEED_")
      ? error.message
      : "Owner setup failed. Check configuration, database availability and unique email. Details redacted.",
  );
  process.exitCode = 1;
} finally {
  await closeDatabase();
}
