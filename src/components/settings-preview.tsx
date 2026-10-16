"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Notice, PageHeader, Pill, Toast } from "./ui";
import { clientApi } from "@/lib/client-api";
import type { OrganizationView } from "@/types/domain";
export function SettingsPreview({
  organization,
  ownerEmail,
  aiConfigured,
  emailConfigured,
  tracingConfigured = false,
}: {
  organization: OrganizationView;
  ownerEmail: string;
  aiConfigured: boolean;
  emailConfigured: boolean;
  tracingConfigured?: boolean;
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  return (
    <>
      <PageHeader
        eyebrow="YOUR WORKSPACE, YOUR PREFERENCES"
        title="A rhythm that works for you."
        description="Verify your own address, choose your schedule, and explicitly opt in."
      />
      <Notice title="Preferences are persisted">
        Dates stay date-only. Reminder jobs use your timezone. Provider
        acceptance is not delivery; the separate worker must run to process
        schedules.
      </Notice>
      <form
        className="settings-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          setPending(true);
          setError("");
          try {
            await clientApi("/api/settings", "PATCH", {
              name: data.get("name"),
              timezone: data.get("timezone"),
              emailOptIn: data.get("emailOptIn") === "on",
              reminderOffsetsDays: data.getAll("offset").map(Number),
              reminderLocalTime: data.get("localTime"),
            });
            setMessage(
              "Preferences saved. Eligible reminder schedules updated.",
            );
            router.refresh();
          } catch (error) {
            setError(error instanceof Error ? error.message : "Save failed.");
          } finally {
            setPending(false);
          }
        }}
      >
        <Card>
          <div className="card-header">
            <h2>Workspace essentials</h2>
          </div>
          <div className="card-content form-grid">
            <div className="field">
              <label htmlFor="workspace-name">Workspace name</label>
              <input
                id="workspace-name"
                name="name"
                required
                maxLength={120}
                defaultValue={organization.name}
              />
            </div>
            <div className="field">
              <label htmlFor="settings-timezone">Timezone</label>
              <select
                id="settings-timezone"
                name="timezone"
                defaultValue={organization.timezone}
              >
                {Array.from(
                  new Set([
                    organization.timezone,
                    "Africa/Lagos",
                    "Europe/London",
                    "America/New_York",
                    "Pacific/Honolulu",
                  ]),
                ).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
        <Card>
          <div className="card-header">
            <h2>Email preferences</h2>
            <Pill>
              {emailConfigured ? "Provider configured" : "Provider unavailable"}
            </Pill>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="notification-email">
                  Owner email (
                  {organization.verifiedNotificationEmail === ownerEmail
                    ? "verified"
                    : "not verified"}
                  )
                </label>
                <input id="notification-email" readOnly value={ownerEmail} />
                <span className="field-help">
                  Signing in does not verify this address for reminders. No
                  arbitrary recipients are accepted.
                </span>
              </div>
              <div className="field">
                <label htmlFor="delivery-time">Preferred local time</label>
                <input
                  id="delivery-time"
                  name="localTime"
                  type="time"
                  defaultValue={organization.reminderLocalTime}
                  required
                />
              </div>
            </div>
            <label className="checkbox-label" style={{ marginTop: 20 }}>
              <input
                type="checkbox"
                name="emailOptIn"
                defaultChecked={organization.emailOptIn}
                disabled={organization.verifiedNotificationEmail !== ownerEmail}
              />
              I explicitly opt in to email reminders at my verified owner
              address.
            </label>
            <fieldset style={{ border: 0, padding: 0, marginTop: 24 }}>
              <legend>Preferred reminder offsets</legend>
              <div className="offsets">
                {Array.from(
                  new Set([30, 7, 1, 0, ...organization.reminderOffsetsDays]),
                )
                  .sort((a, b) => b - a)
                  .map((days) => (
                    <label className="checkbox-label" key={days}>
                      <input
                        name="offset"
                        type="checkbox"
                        value={days}
                        defaultChecked={organization.reminderOffsetsDays.includes(
                          days,
                        )}
                      />
                      {days === 0 ? "On the day" : `${days} days before`}
                    </label>
                  ))}
              </div>
            </fieldset>
          </div>
        </Card>
        <Card>
          <div className="card-header">
            <h2>Connection status</h2>
          </div>
          <div className="card-content">
            {[
              ["Owner authentication", "Signed in"],
              ["MongoDB persistence", "Connected"],
              [
                "Gemma extraction",
                aiConfigured ? "Configured" : "Not configured",
              ],
              [
                "Email provider",
                emailConfigured ? "Configured" : "Unavailable",
              ],
              [
                "Sentry tracing",
                tracingConfigured
                  ? "Configured · visibility unverified"
                  : "Not configured",
              ],
            ].map(([label, status]) => (
              <div className="connection-row" key={label}>
                <span>{label}</span>
                <Pill
                  tone={
                    status === "Connected" ||
                    status === "Signed in" ||
                    status === "Configured"
                      ? "teal"
                      : "neutral"
                  }
                >
                  {status}
                </Pill>
              </div>
            ))}
            <p className="small muted" style={{ marginTop: 18 }}>
              SMS and WhatsApp are unavailable. Scheduled email requires the
              separate worker and provider. Check actual run outcomes in Render.
              Gemma candidates always require your review before saving.
            </p>
          </div>
        </Card>
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </form>
      <EmailControls
        verified={organization.verifiedNotificationEmail === ownerEmail}
        optedIn={organization.emailOptIn}
        configured={emailConfigured}
        onMessage={setMessage}
        onError={setError}
      />
      {message && <Toast message={message} onDismiss={() => setMessage("")} />}
    </>
  );
}

function EmailControls({
  verified,
  optedIn,
  configured,
  onMessage,
  onError,
}: {
  verified: boolean;
  optedIn: boolean;
  configured: boolean;
  onMessage: (s: string) => void;
  onError: (s: string) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [preview, setPreview] = useState("");
  async function action(path: string, body: unknown) {
    setBusy(true);
    onError("");
    try {
      const r = await clientApi<{ message: string }>(path, "POST", body);
      onMessage(r.message);
      router.refresh();
    } catch (e) {
      onError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Card>
      <div className="card-header">
        <h2>Verify and test your email</h2>
      </div>
      <div className="card-content settings-stack">
        {!configured && (
          <Notice title="Email provider unavailable">
            Preview works without delivery. Verification and real test email
            require a configured Resend key and verified sender.
          </Notice>
        )}
        {!verified && (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={!configured || busy}
              onClick={() => action("/api/email-verification", {})}
            >
              Email me a verification code
            </Button>
            <div className="field">
              <label htmlFor="verification-code">
                Code from your mailbox (expires in 15 minutes)
              </label>
              <input
                id="verification-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="one-time-code"
                maxLength={100}
              />
            </div>
            <Button
              type="button"
              disabled={!code || busy}
              onClick={() =>
                action("/api/email-verification/confirm", { code })
              }
            >
              Verify my address
            </Button>
          </>
        )}
        <p className="muted">
          A TEST goes only to your verified owner address. Save explicit opt-in
          first. Limited to one test per ten minutes. No due date changes.
        </p>
        <Button
          type="button"
          disabled={!configured || !verified || !optedIn || busy}
          onClick={() => action("/api/test-email", { confirm: true })}
        >
          Send TEST reminder to my verified email
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={async () => {
            try {
              const r = await clientApi<{ text: string; label: string }>(
                "/api/reminder-preview",
              );
              setPreview(r.label + "\n\n" + r.text);
            } catch (e) {
              onError(e instanceof Error ? e.message : "Preview unavailable.");
            }
          }}
        >
          View non-delivering preview
        </Button>
        {preview && (
          <pre
            style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            role="status"
          >
            {preview}
          </pre>
        )}
        <p className="small muted">
          Provider accepted is not delivered. Delivery receipts are not
          integrated; this app never invents a delivered status.
        </p>
      </div>
    </Card>
  );
}
