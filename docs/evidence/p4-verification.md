# P4 verification — 2026-10-15 UTC

**Result: P4 code/reliability verified; real-email exit gate BLOCKED.** No real email was sent, accepted or received. `EMAIL_API_KEY` and `EMAIL_FROM` are blank in both ignored environment files. The master specification and phase prompts were not changed. P5 was not started; no deployment, cron, spending, commit or push occurred.

## Implemented and affected files

- `src/lib/notifications/planner.ts`: pure calendar/timezone planning via Temporal; past offset coalescing, due-day timing, leap years, DST and date line.
- `jobs.ts`, `hooks.ts`: transactional schedules for eligible manually confirmed or document-confirmed renewals; unique job key includes version/offset/settings revision; repeated planning and unchanged settings saves do not duplicate work. Previously attempted offsets are not replayed when settings change.
- `worker.ts`: transactional atomic claims, two-minute lease/token fencing, bounded attempts/backoff and 20-hour retry horizon, current owner/version/settings revalidation, stable persisted provider payload, cancellation/in-flight outcome handling. No delivered writes.
- `provider.ts`: fixed Resend HTTPS adapter, redacted error codes, retry categorization, best-effort provider idempotency. Provider accepted differs from delivery. No live provider credentials were available.
- `service.ts`, `routes.ts` plus `/api/email-verification`, `/api/email-verification/confirm`, `/api/test-email`, `/api/reminder-preview`: signed-in owner only; mutation origin checks and strict Zod input; random 15-minute mailbox code stored as a digest, single-use/scoped proof; explicit opt-in; verification limits and one TEST per ten minutes; no arbitrary recipients. Preview is non-delivering and cannot verify a mailbox.
- `src/lib/renewals/service.ts`, `src/lib/api/routes.ts`: create/edit/renew/settings integration, obsolete cancellation, activity attempts. Existing P3 approval hook now calls the real scheduler; pending extraction candidates still do not create jobs.
- `src/lib/db/client.ts`, `src/types/domain.ts`: verification collection TTL/indexes, organization job index, job leases/attempts/payload and settings revision types.
- `src/components/settings-preview.tsx`, dashboard/shell/landing and settings/activity pages: real preferences, proof/test controls, clear provider-unavailable state and non-delivering preview, stored activity. SMS/WhatsApp remain unavailable.
- `scripts/process-reminders.mjs`: independent one-shot CLI, same Next environment loader/precedence, 25-job batch, client close and exit. `verify-p4-atlas.mjs`, `verify-p4-browser.mjs`: reproducible probes.
- `tests/unit/reminder-planner.test.ts`, `tests/integration/reminder-workflow.test.ts`; one old P3 assertion updated from `deferred` to `disabled` for an unverified/opted-out owner.
- `package.json`/lock: pinned `@js-temporal/polyfill` 0.5.1 and explicit `@next/env` 16.4.0 (matches installed Next). `.env.example`, README, notification module README, `docs/P4_SETUP.md`, root tracker.

## Executed commands

| Command | Actual result | Evidence |
| --- | --- | --- |
| `npm install --save-exact @js-temporal/polyfill@0.5.1` | Exit 0 | p4-install.txt |
| `npm install --save-exact @next/env@16.4.0` | Exit 0 | p4-env-install.txt |
| `npm run lint` | Exit 0, zero warnings | p4-lint.txt |
| `npm run typecheck` | Exit 0 | p4-typecheck.txt |
| `npm test` | Exit 0, **80 tests**, 11 files | p4-test.txt |
| `npm run test:integration` | Exit 0, **41 tests**, 3 files (16 P4 additions) | p4-integration.txt |
| `npm run build` | Exit 0; all new routes included | p4-build.txt |
| `npm run format:check` | Exit 0 | p4-format-check.txt |
| `npm run reminders:process` | Exit **2**, expected unavailable-provider outcome, zero processed/sent; exits promptly | p4-worker-unconfigured.txt |
| `node scripts/verify-p4-atlas.mjs` | PASS: real Atlas transaction, four synthetic planner jobs, unique idempotency rejection, new connection reads all four | p4-atlas.txt; p4/atlas-proof.json |
| `node --env-file=.env.local scripts/verify-p4-browser.mjs` with bundled Playwright path | PASS: eight checks, six screenshots, zero runtime errors | p4-browser.txt; p4/browser-report.json |

Integration tests use **real native ephemeral MongoDB replica sets**, synthetic account data and **mock email transports**. Test provider message IDs are synthetic and are never live acceptance evidence. Coverage includes: atomic parallel claims, persistent leases across connection close/reopen, a separate Node worker process exiting after claim and a later recovery, stale-token suppression, coalescing overdue offsets without duplicate burst, stable retry key/bytes, provider 429/500 retries, permanently invalid recipient outcome, five-attempt bound/20-hour horizon, renewal version/archive/opt-out invalidation, settings reschedule/no-op, proof replay/cross-owner/expiry, origin/auth/injection, test throttle, preview and no due-date mutation. Unit transport tests use mocked HTTP; no real provider call occurs.

Browser checks use the existing `.invalid` synthetic local owner: actual login, disabled real-send/verification controls when unconfigured, labelled non-delivering preview, settings save/reload, scoped activity API, and settings/activity at 360/768/1280px without document overflow. `settings-360.png` was visually inspected. This does not establish device, Safari or deployed behavior.

Initial failures were corrected and not hidden: P3's previous `deferred` assertion failed after the hook became real (`p4-integration-initial.txt`); the correct state for that unverified/opted-out fixture is `disabled`. A mock function's inferred empty argument tuple initially broke TypeScript; its transport signature is now explicit. The first worker probe tried DB setup before discovering absent email configuration while the local DB was stopped; configuration is now checked before claims/index access and the final unavailable probe exits 2 with zero sends. Local DB and Next were started for the browser run.

## Atlas and configuration boundaries

The founder's `.env` Atlas URI works. This probe used **a new isolated synthetic evidence database**, named in `p4/atlas-proof.json`, not existing production records. It writes synthetic jobs directly to verify storage/index/transaction behavior; it does not pretend to verify a real mailbox or the entire P2 owner UI story on Atlas. The small evidence database is retained, not deleted. The local app and worker still load the loopback URI from `.env.local` ahead of `.env`. Earlier tracker wording that Atlas credentials are absent is superseded; full authenticated Atlas app acceptance remains pending.

## Remaining gates and operating risks

- **P4.05/P4.06 blocked:** configure a real Resend key and verified sender securely, use a private owner mailbox you control, request/confirm its code, explicitly opt in and save, then send the authorized TEST. Record actual provider acceptance separately from inbox receipt. Do not mark these tasks done from synthetic tests.
- No delivery webhook; no job is set to delivered. No received-email screenshot exists. No email was sent to strangers.
- At-least-once execution risk remains. Resend idempotency retains keys for 24 hours; retries stop within 20 hours. An owner cancellation cannot recall an already in-flight provider request. If cancellation wins, the actual later acceptance is recorded without reactivating the cancelled job. [Provider documentation](https://resend.com/docs/dashboard/emails/idempotency-keys).
- Render Cron/deployment/CI/Sentry are outside P4 and unconfigured. The one-shot CLI is tested; unattended scheduled execution is not claimed. A batch may end early when a selected renewal has another active lease; subsequent cron invocations resume.
- Existing five high development lint-chain advisories remain. No dependency major upgrade was attempted. Build/tests are local evidence, not production readiness.
- Git remains at initial SHA `51c5f2af008eb247340373760b3a0f0793b550d4`; no commit/push authorization. Master SHA-256 remains `30E867667519B3C9549387CABD218F33EF6803A212E9F16E1195DB8B3A8CB9A0`; phase prompts remain `A961399B147354372A46026FA9AA0945F820E7C69BCD7F7905668FC06A0C182D`.

Community Wisdom research was attempted with two targeted DevRelay semantic searches (retries/idempotency and pitfalls). Results were unrelated; no community claim or citation was invented. Implementation follows the locked spec and current [Resend API](https://resend.com/docs/api-reference/emails/send-email), [idempotency reference](https://resend.com/docs/dashboard/emails/idempotency-keys), [Temporal polyfill](https://github.com/js-temporal/temporal-polyfill), and installed Next route-handler guide. **Next work: P4 configuration/real-send verification; P5 not started.**
