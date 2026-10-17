import { validateEnv } from "./security/env";

export const siteName = "KAI247 AI";
export const siteDescription =
  "Track business renewals in one place. Review Gemma-extracted document dates, confirm deadlines and manage verified-owner email reminders for your Nigerian business.";

/** Public canonical origin, separate from the authentication APP_URL. */
export function getSiteUrl(
  input: Record<string, string | undefined> = process.env,
) {
  return new URL(validateEnv(input).SITE_URL ?? "https://kai247.pdev.tech");
}
