# P4: owner email and persistent reminders

P4 code and synthetic reliability checks are implemented. **Real mailbox verification, sender verification and TEST email are blocked:** `EMAIL_API_KEY` and `EMAIL_FROM` are blank in both local environment files. No real email was sent. Provider acceptance is not delivery.

## Configure without exposing secrets

The adapter uses **Resend** at its fixed HTTPS `/emails` endpoint. Configure a verified sender/domain in Resend, then place `EMAIL_API_KEY` and `EMAIL_FROM` in ignored environment configuration or deployment secrets. `EMAIL_FROM` accepts an address or `KAI247 <address>`; CR/LF is rejected. Never use `NEXT_PUBLIC_*` for secrets.

Next and the worker use the same environment precedence: existing process environment, `.env.development.local`/`.env.production.local`, `.env.local`, environment-specific file, then `.env`. **This workspace's `.env.local` overrides the Atlas URI in `.env` with local MongoDB.** Atlas connectivity and isolated job persistence have now passed; this does not migrate existing local records or establish the full P2 Atlas app workflow. Deliberately choose the database configuration before running a worker; do not point a development sandbox at customer records accidentally. Restart the web process after changing environment files.

Use a private owner account whose email you control (`SEED_OWNER_MODE=private`; operator provisioning is described in P2 setup). The existing `.invalid` synthetic sandbox cannot receive or verify email. Do not change a shared sandbox recipient to a real person's mailbox.

1. Sign in and open **Settings**.
2. Request a verification email. Recipient comes only from the authenticated owner record. This message is solely for proving mailbox possession; reminders remain off.
3. Paste the random code from that mailbox into Settings within 15 minutes. Only its hash is stored. Verification is single-use and scoped to user, organization and current email, with expiry checked independently of TTL cleanup. Request limit: three/hour; confirmation attempts: ten/15 minutes.
4. Explicitly tick email opt-in and save. Defaults remain Africa/Lagos, 09:00, 30/7/1/0 days. No arbitrary recipient field is accepted.
5. Click **Send TEST reminder to my verified email**. This is an explicit TEST, limited to one per ten minutes per organization. No real due date is changed. Inspect **Activity** for actual provider outcome and attempts; check the mailbox yourself. A rejected or unavailable provider is never labelled delivered.
6. Record redacted provider acceptance and, separately, any actual inbox receipt. P4's real-send checkbox must stay blocked until this is done.

When the provider is absent, **View non-delivering preview** renders labelled synthetic TEST text without scheduling or sending. Preview cannot verify the owner address. No development bypass marks a mailbox verified.

## One-shot worker

```powershell
npm run reminders:process
```

The command loads configuration with Next's environment loader, processes up to 25 jobs sequentially, closes the pooled client and exits. Exit 0: batch completed (possibly no due jobs); exit 2: provider unavailable, zero claims/sends; exit 1: service/configuration error, safely redacted. It creates no timer or HTTP scheduler endpoint. Render Cron configuration, actual run evidence, frequency and spending approval belong to **P5**; nothing is deployed by P4.

Jobs use date-only calendar subtraction and IANA timezone conversion via pinned Temporal polyfill 0.5.1. DST gaps move forward and folds choose the earlier occurrence (`compatible`). Past offsets become one catch-up upcoming/overdue alert; if an alert is already due later today, that alert covers today. Future offsets remain. After downtime, the latest due offset is claimed and older pending due offsets for that renewal version are cancelled, avoiding a catch-up burst.

Creation and extraction confirmation, edits, replacement renewal dates and changed notification settings plan eligible schedules within MongoDB transactions. Unapproved extractions never schedule. Renewal version and a notification settings revision are part of the unique job key; offsets already attempted are not replayed on settings changes. Unchanged saves do not recreate schedules. Opt-out and archive cancel pending/claimed work. Manual and document-confirmed dates follow the same deterministic planner; AI never sets the schedule.

## Reliability and limits

- Atomic transactional claims serialize per renewal; token-fenced leases last two minutes. A separate worker can recover an expired lease. Current ownership, opt-in, email, renewal version, archive status and settings revision are checked before dispatch. Obsolete jobs are cancelled.
- Five attempts maximum; exponential backoff starts at one minute, respecting capped provider `Retry-After`. HTTP 429/408/5xx and network failures retry; invalid recipients and permanent provider rejections fail terminally. Attempts end after 20 hours from first claim, inside Resend's documented 24-hour idempotency retention. Long outages then require operator inspection rather than a risky automatic replay.
- Exact provider request bytes are persisted once for retries; stable job key is passed in `Idempotency-Key`. Email payload and recipient remain server-side; activity returns only redacted metadata. This is duplicate suppression with **at-least-once risk**, not exactly-once email.
- An external HTTP send cannot be rolled back if an owner opts out or replaces a date during that request. Checks immediately before dispatch reduce this window; if cancellation wins during HTTP, the actual acceptance is recorded as `provider_accepted_after_invalidation` without reactivating the cancelled job. Already accepted messages cannot be recalled.
- Activity shows pending, claimed/attempted, provider accepted, failed and cancelled from real MongoDB records, including attempt history. There is **no delivery webhook integration**; the implementation never writes `delivered`. SMTP/inbox delivery remains outside app guarantees.
- Scheduling existing large workspaces in one settings transaction is appropriate for the MVP; a larger product would need a bounded reconciliation job. A busy/leased renewal can make a batch return early; subsequent cron runs resume work. No unattended cron reliability is claimed locally.

## Verification

`npm test`, `npm run test:integration`, `npm run lint`, `npm run typecheck`, `npm run build`.

The integration suite uses native ephemeral MongoDB replica sets and **synthetic email transports only**. It tests real transactions/claims, concurrency, child-process exit/recovery, version invalidation, retry and mailbox proof. No fixture provider ID is real acceptance evidence.

`node scripts/verify-p4-atlas.mjs` reads `.env` directly and creates a newly named, isolated `kai247_p4_evidence_*` database with four clearly synthetic planner jobs. It tests persistence, unique indexes and reconnection only; it does not read production records, verify a mailbox or send email. The retained database is identified in `docs/evidence/p4/atlas-proof.json`; no automatic deletion was performed.

`scripts/verify-p4-browser.mjs` uses the ignored synthetic sandbox and an externally available Playwright/Chrome installation. Screenshots and report: `docs/evidence/p4/`.

Official references: [Resend send API](https://resend.com/docs/api-reference/emails/send-email), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill). See `docs/evidence/p4-verification.md` for executed results and known blockers.
