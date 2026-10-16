# P6 verification — 2026-10-16 UTC

P6 only. Local implementation, production-build HTTP smoke and genuine Sentry ingestion/dashboard visibility pass. **P6 is uncommitted and not deployed.** P7 is not started. The locked master and phase prompts are unchanged.

## Executed checks

| Check | Result | Evidence |
| --- | --- | --- |
| SDK installation | Pass; exact `@sentry/nextjs` 11.8.0 installed and lock updated | `package.json`, `package-lock.json` |
| `npm run lint` | Pass, zero warnings | [log](p6-lint.txt) |
| `npm run typecheck` | Pass | [log](p6-typecheck.txt) |
| `npm test` | Pass: 101 tests, 14 files | [log](p6-test.txt) |
| `npm run test:integration` | Pass: 42 tests, 3 files, real ephemeral MongoDB 8.2.6 replica set | [log](p6-integration.txt) |
| `npm run build` | Pass; actual Next 16.4 production build, all 23 generated pages | [log](p6-build.txt) |
| `npm run format:check` | Pass | [log](p6-format-check.txt) |
| Dev/browser smoke | Pass; real synthetic owner workspace on Atlas, loaded screens inspected | [dev log](p6-dev.txt), [browser report](p6/browser-report.json) |
| Production-build HTTP smoke | Pass: 9 checks, Atlas readiness, auth, protected page redirect, origin guards, scoped readback, IDs, secure cookie flags | [report](p6/http-smoke.json) |
| `node scripts/verify-p6-traces.mjs` | Pass; actual Atlas/Gemma/approval plus controlled synthetic failures, no real email | [report](p6/real-traces.json), [command](p6-real-traces.txt) |
| Sentry dashboard | Pass; actual trace waterfall/model usage/failure attributes inspected in Chrome | Screenshots below |
| Final source review | Pass; `git diff --check`, changed-file credential-value scan, locked-document equality | [report](p6/final-review.json) |
| `npm audit --json` | 5 existing high advisories, 0 critical, all in the development ESLint dependency chain | [sanitized audit](p6/audit-summary.json) |

Unit and integration model/email transports are explicitly synthetic. The separate proof script is the genuine model/provider round trip. Tests do not require production secrets. The production-build HTTP smoke runs locally with a production HTTPS origin and manually forwarded synthetic session cookie; it does not establish a new Render deployment or browser HTTPS acceptance. Its server was stopped after the checks. Only task-owned QA servers were stopped; the founder's port 3000 app was not touched.

## Real Sentry evidence and finding

Trace: [7512242656ca4d34a78153a27ee5aa7e](https://tog-africa.sentry.io/explore/traces/trace/7512242656ca4d34a78153a27ee5aa7e/).

- [Waterfall](p6/sentry-waterfall.png): 11 actual spans; parsing, Gemma, schema/evidence validation, explicit approval, disabled scheduling, synthetic provider failure, malformed-PDF failure and one-shot batch.
- [Gemma details](p6/sentry-gemma.png): confirmed `gemma-4-26b-a4b-it`, **5.74 seconds**, **1,007 input / 204 output tokens** supplied by provider. Sentry's display token totals/cost estimates are not independent billing evidence.
- [Synthetic failure](p6/sentry-synthetic-email-failure.png): injected HTTP 500 transport, `synthetic=true`, `provider_rejected`, `retryable=true`, error status. No network email was sent. Malformed synthetic PDF was also rejected with `MALFORMED_DOCUMENT` and a sanitized error event.
- Sentry's ingestion transport returned HTTP 200 for every submitted evidence envelope. Dashboard visibility was then independently verified; HTTP 200 alone was not treated as sufficient.

The model request was the longest observed extraction step: 5.74s versus about 1ms text parsing and 17.8ms deterministic evidence validation. The encompassing AI service took 6.87s, including database operations. Approval took 1.51s. This is one observed run, **not a benchmark, percentile or optimization claim**. The earlier genuine run is retained in [initial report](p6/real-traces-initial.json), not hidden. No P7 evaluation was started.

The real proof's scheduling span truthfully reports `disabled`, zero jobs: its synthetic owner is unverified and opted out. Integration tests separately exercise eligible scheduling, idempotency, claims, cancellation, retries and recovery. The proof's unconfigured batch processes zero jobs. No delivered-email status or live send is claimed.

## Practical security review

| Area | Executed coverage / outcome |
| --- | --- |
| Authentication and protected routes | Actual HTTP 401 for missing session; `/app` redirects to login; valid synthetic login succeeds. Integration tests reject forged/expired/revoked sessions and the historical preview cookie. |
| Organization isolation / IDOR | Real-MongoDB tests reject other-owner read, edit, archive, renew, extraction review and recipient/organization injection. Actual HTTP rejects malformed IDs (400) and hides nonexistent valid IDs (404). |
| CSRF | Actual HTTP rejects foreign-origin login and authenticated writes (403); integration tests also cover extraction confirmation and notification routes. |
| Invalid/oversized uploads | Actual parser rejects the deliberately malformed synthetic PDF; integration rejects broken PDF, disguised and image-only PDFs and oversized chunked uploads before inference. |
| Slow streaming bodies | New fake-clock tests prove total 15s deadline/cancellation for stalled JSON and multipart streams. Existing byte limits remain covered. |
| Malicious document instructions | Synthetic adversarial prompt/evidence fixtures, bounded retry and human-confirmation tests pass. Unsupported/fabricated dates never silently create renewals. This is not a claim that all prompt injection is eliminated or a new real-model adversarial benchmark. |
| Model identity / usage | Exact normalized model match now required; suffix spoof and malformed/negative token counts are rejected in adapter tests. |
| Rate limits | Shared datastore tests exercise failed sign-ins, workspace extraction quota and owner-only email test throttle. No production load test was performed. |
| Logging/telemetry | Real SDK test transport receives no nested canary document/email/secret in spans or errors. Sentry screenshots show only curated metadata. Request/user/body/stack/breadcrumb/log/metric collection is explicitly disabled. |

## Defects fixed and retained failures

1. JSON/multipart readers previously had byte caps but no total body deadline. Added shared 15s deadline and nonblocking cancellation; tests verify 408 and retained caps.
2. Gemma identity previously accepted a matching prefix with an arbitrary suffix; exact normalized identity is now enforced. Provider token counts are runtime validated.
3. Mobile navigation did not dismiss on Escape; it now closes and restores visible focus to its toggle. Login errors now describe both fields and mark them invalid. Stale shell copy claiming no email could ever be scheduled was corrected to the actual verification/opt-in/provider conditions. Settings reports telemetry configuration without claiming runtime visibility.
4. A misplaced brace introduced while annotating disabled scheduling prevented eligible jobs from being created. The reminder integration suite caught it (11 failed / 31 passed). Fixed it and reran the full integration suite: **42 passed**. [Failed log retained](p6/integration-failed-before-fix.txt).
5. One typecheck collided with dev-server regeneration of `.next/dev/types` and failed with TS6053. The task-owned dev server was stopped; serial typecheck and production build then passed. [Failed log retained](p6/typecheck-generated-types-race.txt).
6. Next automatic spans initially normalized to misleading `server_error` names despite successful status. Unknown names now normalize to `server_operation`; original names/attributes remain stripped. Privacy regression assertion passes.

## Browser evidence

[Browser report](p6/browser-report.json) records loaded headings, control counts and document widths. At 360px: dashboard, settings (10 controls), manual form (11), import (1) and empty activity have no document horizontal overflow or unlabeled form controls. Manual form also fits 768px and 1280px. Escape dismissal restores the toggle with a solid focus outline. An actual invalid sign-in returns the generic error and links it to both inputs.

- [Dashboard 360px](p6/dashboard-360.png)
- [Empty notification history 360px](p6/activity-empty-360.png)
- [Manual form desktop](p6/manual-form-1280.png)
- [Login error 360px](p6/login-error-360.png)

Viewports were reset after QA. This does not replace physical-device or assistive-technology testing.

## Release boundary and remaining gates

Baseline `main` HEAD: `cfbb19ef38814d2a25f8bc7eaca2388e2f9fdd51`. No P6 commit/push/deployment was performed: shared instructions require founder authorization, and the earlier approval was P5-specific. Public app/hosted CI links in the P5 report remain historical P5 evidence.

The founder added email configuration; no verified opted-in owner real TEST acceptance/receipt was demonstrated in P6. The last checked Cron still lacked email provider variables. That P5 gate stays open. P6 failure evidence explicitly uses a synthetic transport. Sentry on Render web/Cron must be configured and a deployed P6 trace verified after publication; local DSN configuration is not proof of deployment configuration.

Five existing high advisories remain in the development-only ESLint/fast-glob/micromatch/braces chain. npm proposes an incompatible major downgrade of the Next ESLint config, so it was not applied blindly. No new runtime advisories were reported. Intermittent real PDF model-output failures from P5, no OCR, no delivery receipt integration and Sentry retention/quota decisions remain documented limits.

Master SHA256: `30e867667519b3c9549387cabd218f33ef6803a212e9f16e1195db8b3a8cb9a0`. Phase prompts SHA256: `a961399b147354372a46026fa9aa0945f820e7c69bcd7f7905668fc06a0c182d`. Root copies still match their retained `docs/` copies.

Next planned phase is **P7 only after a new explicit request**; resolve the outstanding real-email/deployment gates before making complete-MVP or submission claims. Stop at P6.
