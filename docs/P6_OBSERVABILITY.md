# P6: server observability and safeguards

P6 is verified locally against real Atlas and Gemma, with actual sanitized spans visible in the founder's Sentry project. This work has not been committed, pushed or deployed. The public Render release remains P5. See [executed evidence](evidence/p6-verification.md).

## Configuration

Use Node 22.18+ or 24 LTS. `npm ci` installs pinned `@sentry/nextjs` 11.8.0. Privately set `SENTRY_DSN`; optionally set `SENTRY_TRACES_SAMPLE_RATE` between 0 and 1. Default is 0.1. Missing DSN disables telemetry without blocking the app or reminder worker; malformed supplied environment settings fail validation. Settings reports configuration presence only, never trace visibility or a DSN value.

Next's normal environment precedence applies: `.env.local` overrides `.env`, including blank values. The final presence-only check confirmed the current normal development environment resolves a configured DSN. Never paste the DSN or tokens in chat, screenshots or Git. No `NEXT_PUBLIC_*` telemetry setting is used.

`src/instrumentation.ts` initializes the Node server SDK and handles unexpected server errors. The separate `npm run reminders:process` command initializes the same configuration, processes one batch, closes MongoDB and flushes telemetry before exit. No web-process scheduler was added.

After reviewing and authorizing publication of P6, set `SENTRY_DSN` and optional sampling privately on **both** Render web and Cron services, deploy the approved commit, then inspect an actual production trace. Local Sentry evidence does not establish Render configuration. Do not enable a paid Sentry trial or source-map upload just to run these checks.

## Spans and privacy boundary

| Operation | What is measured |
| --- | --- |
| `ai_workflow` | Actual extraction service, including persistence |
| `parse_document` | TXT/PDF text extraction |
| `gemma_extract` (`gen_ai.chat`) | Each actual model attempt, configured/confirmed model, provider-supplied token counts |
| `validate_candidate` | JSON/schema parsing and deterministic source/date evidence validation |
| `approve_renewal` | Explicit owner confirmation (the tracker's `confirm_record` step) |
| `queue_reminder` | Existing deterministic scheduling; records disabled vs scheduled and jobs created |
| `send_email` | Actual transport boundary; provider acceptance/rejection, curated code and retryability |
| `reminder_batch` | One-shot worker batch and provider-unavailable outcome |

Every step records measured elapsed milliseconds and success/failure. Bounded model retries remain separate spans. Sampling is trace-based; 0 disables spans, while sanitized error events may still be sent. The proof script uses 1 only for its bounded synthetic run.

SDK 11's data collection defaults are explicitly disabled. No document text, prompts, output, excerpts, filenames, recipient addresses, account IDs, provider response bodies, credentials, request headers/cookies/bodies/query strings, breadcrumbs, arbitrary error messages or stack context are allowed into application telemetry. Spans and errors are rebuilt from an allowlist rather than recursively masking unknown payloads. Numeric token counts are accepted only when supplied as valid nonnegative integers. Errors carry a static message and a curated code. Automated Next spans are normalized to `server_operation`, not misleadingly named as errors; their original names/attributes are discarded. Default SDK integrations, logs and metrics are disabled. There is no browser replay or browser Sentry initialization, and source-map upload is disabled.

Sentry may derive additional display metadata such as token totals and cost. Only provider-supplied counts and actual application timing are evidence here; UI cost estimates are not verified billing measurements. Sentry retention, quotas and organizational access remain the founder's responsibility.

## Reproduce the controlled proof

`node scripts/verify-p6-traces.mjs` deliberately reads primary `.env`, uses a new randomly named **synthetic Atlas database**, invokes real Gemma on the synthetic insurance TXT fixture, validates evidence, and explicitly confirms the supported date. It writes sanitized `docs/evidence/p6/real-traces.json`. It also exercises a deliberately malformed synthetic PDF and an injected synthetic HTTP 500 email transport. **No real email is sent.** An unconfigured batch processes zero jobs. This is an application-service proof, supplemented by browser and production-build HTTP checks, not a deployed inference benchmark.

This opt-in command incurs a real inference call and creates isolated synthetic records. It stores temporary credentials/environment in ignored `.local/p6-app-private.json` for local QA; do not upload or commit that file. It does not change existing organizations or delete evidence databases. The normal app and worker continue to use Next's normal environment precedence.

Open [the verified trace](https://tog-africa.sentry.io/explore/traces/trace/7512242656ca4d34a78153a27ee5aa7e/) while signed into the founder's Sentry organization. Select Gemma for its model, measured time and usage. Select `send_email` for `synthetic=true`, `PROVIDER_HTTP_500`, `provider_rejected`, and error status. Screenshots in `docs/evidence/p6/` contain no credentials or private documents.

## Practical safeguards and operational limits

JSON and multipart readers now share a total 15-second body deadline, retaining the 32 KB JSON and 5 MB file limits. A stalled stream returns a controlled 408 and is cancelled; each chunk cannot reset the deadline. This bounds application body reads, not every proxy/network resource. Existing parser/model timeouts, origin checks, session revocation, organization authorization and MongoDB rate limits remain in effect.

Model identity must match the configured Gemma model exactly after the supported `models/` prefix is normalized. A matching prefix with an arbitrary suffix no longer passes. Validation and human approval remain mandatory; these controls do not claim to eliminate all prompt injection or model errors.

Mobile navigation dismisses on Escape and restores focus. Login error text is announced and associated with both fields. At 360px, checked dashboard/settings/manual/import/activity screens have no document-level horizontal overflow; tablet/desktop manual forms were also inspected. This is browser QA, not physical-device certification.

Existing limitations remain: intermittent model-output failures, no OCR, no delivered-email claim without receipt, outstanding P5 real-email/Cron-provider gate, and five existing high-severity development-lint dependency advisories. Do not force npm's proposed downgrade to Next 14's ESLint config into this Next 16 application.

## References

- [Sentry Next.js manual setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [Sentry Next.js SDK options](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/)
- [Sentry custom tracing](https://docs.sentry.io/platforms/javascript/guides/nextjs/tracing/instrumentation/custom-instrumentation/)
- Installed Next 16.4 documentation: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md`.

The required community-wisdom search returned unrelated results; no community performance or security claim is inferred from them. SDK implementation follows official documentation and installed type contracts.
