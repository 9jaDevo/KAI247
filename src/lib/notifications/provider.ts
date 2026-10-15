import { z } from "zod";
export interface EmailMessage {
  from: string;
  to: string[];
  subject: string;
  text: string;
}
export type EmailResult =
  | { accepted: true; id: string }
  | {
      accepted: false;
      code: string;
      retryable: boolean;
      retryAfterMs?: number;
    };
export type EmailTransport = (
  message: EmailMessage,
  key: string,
) => Promise<EmailResult>;
export function emailStatus() {
  const from = process.env.EMAIL_FROM?.trim();
  const address = from?.match(/<([^<>]+)>$/)?.[1] ?? from;
  const configured =
    !!process.env.EMAIL_API_KEY?.trim() &&
    z.email().safeParse(address).success &&
    !/[\r\n]/.test(from ?? "");
  return {
    configured,
    provider: "Resend",
    message: configured
      ? "Configured; acceptance is not delivery."
      : "Email provider unavailable. Preview does not deliver.",
  };
}
/** Fixed HTTPS provider endpoint: no user-controlled URL or raw provider errors in logs. */
export const sendEmail: EmailTransport = async (message, key) => {
  if (!emailStatus().configured)
    return { accepted: false, code: "PROVIDER_UNAVAILABLE", retryable: true };
  if (
    message.to.length !== 1 ||
    !z.email().safeParse(message.to[0]).success ||
    /@.*\.invalid$/i.test(message.to[0])
  )
    return { accepted: false, code: "INVALID_RECIPIENT", retryable: false };
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": key,
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });
    if (!response.ok) {
      const seconds = Number(response.headers.get("retry-after"));
      return {
        accepted: false,
        code: `PROVIDER_HTTP_${response.status}`,
        retryable:
          response.status === 429 ||
          response.status >= 500 ||
          response.status === 408,
        ...(Number.isFinite(seconds) && seconds > 0
          ? { retryAfterMs: Math.min(seconds * 1000, 3600000) }
          : {}),
      };
    }
    const data = z
      .object({ id: z.string().min(1).max(200) })
      .safeParse(await response.json());
    return data.success
      ? { accepted: true, id: data.data.id }
      : { accepted: false, code: "PROVIDER_RESPONSE_INVALID", retryable: true };
  } catch {
    return { accepted: false, code: "PROVIDER_NETWORK", retryable: true };
  }
};
export function reminderMessage(
  title: string,
  dueDate: string,
  timezone: string,
  test = false,
) {
  return {
    subject: test ? "[TEST] KAI247 reminder check" : "KAI247 renewal reminder",
    text: test
      ? "TEST EMAIL — KAI247 AI\n\nThis authorized test checks email configuration. No renewal due date was changed.\n\nThis is a TEST, not a scheduled renewal notice. Manage opt-in in Settings."
      : `KAI247 AI renewal reminder\n\n${title}\nConfirmed due date: ${dueDate} (${timezone}, date only).\nReview the renewal in your workspace. This is a reminder, not legal or compliance advice.\n\nManage email opt-in in Settings.`,
  };
}
