# KAI247 · KAI247 AI

**Publication update:** Founder authorized commit/push of the P8 preparation, deferred S1 assessment and reference-based landing redesign. Phase-close statements below describe their original verification state; Git history records this publication. DEV submission and a new hosted deployment are not established by this push.

KAI247 AI helps Nigerian small-business owners review document-derived renewal dates, persist confirmed obligations and track auditable email jobs. Manual entry works without AI.

**P8 status: entry prepared, NOT submitted.** The [ready-to-paste DEV article](docs/P8_DEV_ARTICLE.md), [publication checklist](docs/P8_PUBLICATION_CHECKLIST.md) and [final gate audit](docs/evidence/p8-verification.md) distinguish actual results from open gates. DEV's linked-account API returns 403 dev_account_mismatch; no draft, public post or submission timestamp was obtained. Deadline: **October 18, 2026 23:59 PDT / October 19 07:59 WAT (02:59 EDT)**. The master specification remains unchanged.

**Published source and deployed core:** release [a156994](https://github.com/9jaDevo/KAI247/commit/a156994b951bc608b1b913d1bbe8d1adcd8b9bf0) contains P6/P7. [Hosted CI passed](https://github.com/9jaDevo/KAI247/actions/runs/38905759266). Fresh P8 checks on the [live Render app](https://kai247.onrender.com) passed real HTTPS login, Atlas create/edit/renew/history/readback, actual Gemma TXT extraction (4,773ms), explicit approval and the P7 replacement-provenance fix. Actual deployed browser reload also passes. A dashboard release-SHA check was blocked by the inactive Render connector/browser timeout; do not equate observed behavior with dashboard SHA proof. The public app requires operator-provisioned owner access; no shared real-owner credentials are published. Local synthetic setup below is available to judges.

**Email and tracing boundaries:** P7's separate local Atlas walkthrough verified the real owner's mailbox and opt-in, sent one actual Resend TEST, and received founder receipt/TEST-label confirmation. The last independently inspected scheduled Render Cron invocation had provider unavailable and zero sends. P8 live Settings now shows email/Sentry configured, but production email delivery, current Cron history and production Sentry visibility remain unverified. P6's genuine Sentry screenshots are public. Provider acceptance is not delivered; no receipt webhook exists. See [P6 evidence](docs/evidence/p6-verification.md), [P7 evidence](docs/evidence/p7-verification.md) and [deployment runbook](docs/P5_DEPLOYMENT.md).

**Evaluation:** 16 frozen synthetic texts, two complete unchanged real Gemma runs: strict correctness **2/16** then **10/16**, simple regex **10/16**. All failures are retained. Labels were authored by the implementation agent before inference; independent human review remains pending. See [methodology](docs/P7_METHODOLOGY.md) and [all field counts/failures](docs/evidence/p7-benchmark-analysis.md). No customer feedback, payment or recorded video exists; the [2:40 storyboard](docs/P7_DEMO_STORYBOARD.md) provides screenshots and founder recording steps. Earlier PDF inferences failed safely; reliable general PDF extraction is not claimed.

## Source of truth

Logo/favicon assets and canonical/search configuration are documented in [branding and SEO setup](docs/BRANDING_SEO.md). Public canonical origin defaults to `https://kai247.pdev.tech`, as selected by the founder; optional `SITE_URL` is separate from authentication `APP_URL`. Search Console verification and actual indexing require deployment/account checks.

Read these before every phase:

- [Master specification](01_RENEWPILOT_MASTER_SPEC.md) — sole product/architecture authority, locked.
- [Development tracker](02_DEVELOPMENT_TRACKER.md) — live checklist, verification evidence and handoff.
- [Phase prompts](03_CODEX_PHASE_PROMPTS.md) — shared execution instructions; one phase at a time.

The documents supplied under `docs/` are retained; the **root tracker** is the authoritative live checklist. Current master and prompt root copies match their `docs/` counterparts byte-for-byte. Concurrent workspace edits renamed the working brand to KAI247 AI during P0; those edits were preserved. The agent did not rewrite either master copy or the phase prompts. The spec names `renewpilot-ai`; shared execution instructions name the existing `KAI247` repository. This scaffold keeps the existing repo and records that discrepancy.

## Requirements and local installation

Use Node.js **22.18+ or 24 LTS** and npm (verified locally with Node 24.11.1/npm 11.6.2). Git is recommended. Stable dependency versions are pinned in `package.json` and transitive dependencies locked in `package-lock.json`. Next.js 16.4.0 supports the selected React 19.3.0; Tailwind 4.3.3 uses its matching PostCSS plugin. P1 uses semantic HTML, code-native SVG icons and native dialogs without adding UI dependencies.

```powershell
npm ci
npm run setup:local
npm run db:local
```

Open the exact configured `APP_URL` ([generated local URL](http://127.0.0.1:3000)). Start owner setup and the dev server in another terminal as shown below. P2 owner access requires authentication and MongoDB configuration; use the setup guide below. Installation and build require network access for npm dependencies, but the page does not fetch remote fonts or contact providers.

## Commands

| Command                                   | Purpose                                                                             |
| ----------------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run dev`                             | Local Next.js development server                                                    |
| `npm run build`                           | Production build                                                                    |
| `npm start`                               | Serve an existing production build                                                  |
| `npm run start:render` | Validate production HTTPS/Atlas/auth config, then bind 0.0.0.0 on Render PORT |
| `npm run lint`                            | ESLint, zero warnings allowed                                                       |
| `npm run typecheck`                       | Generate Next route types, then strict TypeScript check                             |
| `npm test`                                | Unit tests with synthetic fixtures and labelled mock model answers; no external services |
| `npm run test:integration`                | Real ephemeral MongoDB replica set; Gemma transport mocked and labelled synthetic   |
| `npm run ai:proof`                        | **Real** Gemma calls on the synthetic fixtures; writes `docs/evidence/p3/gemma-live-proof.json` |
| `npm run fixtures:p3`                     | Regenerate the synthetic PDF fixtures deterministically                             |
| `node scripts/benchmark-p7.mjs --out docs/evidence/p7/run-03` | Real Gemma on the frozen16-text set; primary private .env, new output directory required; consumes provider quota |
| `node scripts/report-p7.mjs docs/evidence/p7/run-01` | Reproduce exact field scores and report offline; no new inference |
| `npm run format` / `npm run format:check` | Format/check code, excluding locked management docs                                 |
| `npm run reminders:process`               | One-shot batch (max 25), closes DB and exits; **2** if provider unavailable, **1** on service error |

## Environment configuration

Keep secrets in ignored `.env.local` or deployment secret settings. `.env.example` contains blank placeholders and a local URL only. Never put secrets in `NEXT_PUBLIC_*` variables, Git, screenshots or logs. `src/lib/security/env.ts` redacts values in errors; the Next config validates supplied settings at startup/build.

| Setting                                                 | P0 / future requirement                                                                           |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `APP_URL`                                               | Defaults to local HTTP; validated URL. HTTPS required when production authentication is requested |
| `AUTH_SECRET`                                           | Blank in P0; required for P2 auth, at least 32 characters                                         |
| `MONGODB_URI`, `MONGODB_DB`                             | Blank in P0; required together for P2 database access                                             |
| `GEMMA_API_BASE_URL`, `GEMMA_MODEL_ID`, `GEMMA_API_KEY` | Required for P3 extraction. OpenAI-compatible endpoint serving Gemma; non-`gemma-*` model IDs are refused |
| `EMAIL_API_KEY`, `EMAIL_FROM`                           | Blank in P0; required for P4 provider delivery; verified sender and owner opt-in still required   |
| `SENTRY_DSN`                                            | Optional server-only Sentry integration; blank disables telemetry |
| `SENTRY_TRACES_SAMPLE_RATE`                             | Optional 0–1; default 0.1; 1 for a bounded synthetic proof only |

Future server modules must call `validateEnv(process.env, ['auth'])`, `['db']`, `['ai']` or `['notifications']` before using that capability. Missing optional credentials do not prevent P0 builds; requesting an unconfigured capability fails clearly. Validation does **not** prove connectivity, model identity, sender verification or delivery. Configuration stays server-side.

## Structure and planned infrastructure

`src/app` holds routes; `src/components` shared UI; `src/lib/{auth,db,ai,renewals,notifications,security}` feature modules; `src/types` domain and serialized UI contracts; `tests/{unit,integration,fixtures}` verification; `scripts` one-shot commands; `.github/workflows` the tested push/PR CI workflow. Domain contracts are implemented in `src/types/domain.ts`; owner-scoped services use MongoDB documents. P1 invented fixtures remain isolated historical UI/test data in `src/lib/renewals/preview-fixtures.ts`.

## Use the P2 owner workspace

See [P2 setup](docs/P2_SETUP.md) for precise local/Atlas configuration, security contracts and verification commands. Local quick start:

```powershell
npm run setup:local
npm run db:local
```

In another terminal:

```powershell
npm run owner:setup
npm run dev
```

The generated `.env.local` contains random credentials and is ignored by Git; inspect it privately to sign in at its exact `APP_URL`. Setup refuses to overwrite existing configuration. Local MongoDB data persists under ignored `.local/mongodb`; a replica set is required for atomic changes. Atlas connectivity and isolated P4 job persistence are verified; this local configuration still uses the local DB.

All `/app` screens now require a real owner session. The P1 public preview marker no longer grants access. The synthetic sandbox has its own owner and organization, is labeled in the interface and never shares another owner's data. Dashboard/list/forms/details/settings use persisted scoped records. Completion history and replacement dates survive reload and a local database-process restart.

Available routes are `/`, `/login`, `/app`, `/app/renewals`, `/app/renewals/new`, `/app/renewals/:id`, `/app/renewals/:id/edit`, `/app/import`, `/app/import/:id`, `/app/activity`, `/app/settings`. The P1 illustrative `/app/import/review` now redirects to `/app/import`. Notification activity shows actual stored jobs and attempt outcomes. Only verified opted-in owners receive scheduled jobs; provider configuration and a running worker are also required.

## Use P3 document extraction

See [P3 setup](docs/P3_SETUP.md) for the Gemma provider, licence notes, pipeline and safeguards, and the [P3 verification report](docs/evidence/p3-verification.md) for real results, including failures. In short: open **Import document**, upload a machine-readable PDF or TXT (≤ 5 MB, ≤ 30 pages), wait for Gemma, then compare the highlighted verbatim evidence and decide. Scanned PDFs without a text layer are rejected; **OCR is not implemented**. Dates whose evidence is not found in the document are discarded, `DD/MM` vs `MM/DD` ambiguity is never guessed, and statutory/CAC deadlines are never calculated. Only owner confirmation creates a renewal; the P4 hook schedules deterministic jobs only for verified, explicitly opted-in owners. Use synthetic or permitted documents only: document text is sent to the configured hosted endpoint.

Run unit tests with `npm test` and real-MongoDB integration tests with `npm run test:integration`. Optional `node --env-file=.env.local scripts/verify-p2.mjs` uses an installed Playwright package/browser (or `KAI247_PLAYWRIGHT_MODULE`) and only synthetic sandbox data. P1 browser artifacts remain historical. Current evidence: [P2 verification report](docs/evidence/p2-verification.md).

P2 persistence, P3 real Gemma extraction and P4 scheduling/reliability are verified locally. P5 also verifies deployed HTTPS owner CRUD/renew/history on Atlas and real Gemma TXT extraction/approval. P7 now verifies the Resend owner mailbox-proof/opt-in/real TEST locally, with founder receipt attestation; the last checked deployed Cron lacked email configuration, so deployed email/Cron validation remains open. P6's synthetic failures remain explicitly synthetic and are not retroactively called real sends. Sentry SDK tracing is verified locally and in its actual dashboard. No web-process timer substitutes for durable scheduling. Paid infrastructure requires founder authorization.

## Contest constraints and evidence

[Official Week 2 terms](https://dev.to/page/hacktoberfest-week2-2026-10-12-contest-rules) were fetched during P0 and specify October 12, 2026 **12:00 PM PDT** through October 18 **11:59 PM PDT** (October 12 19:00 UTC through October 19 06:59 UTC; deadline October 19 07:59 WAT). The older DevRelay general schedule differs on opening time; the official contest terms take precedence.

GitHub API reports [KAI247](https://github.com/9jaDevo/KAI247) created at **2026-10-14T15:44:18Z**, and the sole pre-scaffold initial commit `51c5f2af008eb247340373760b3a0f0793b550d4` has author/committer time **2026-10-14T15:44:11Z**. Both are within the entry window. See [repository metadata](docs/evidence/p0-repository.json) and [initial history](docs/evidence/p0-git-history.txt). Git timestamps alone cannot independently establish all project provenance; no earlier project history was present in this workspace.

One entry, the official DEV template, English article, `devchallenge`/`hf26challenge` tags, public deployment or accessible video, repository link and substantive open-source AI use are required by the plan. Coding with Codex alone is not evidence of Gemma use. The P8 article lists evidence-backed Gemma, Render, Atlas, Sentry and the explicitly allowed GitHub Actions route of the Copilot category. Copilot itself was not used. Other partner categories and organizer eligibility/acceptance are not claimed.

## Verification and limitations

See the root tracker and phase verification reports for actual commands and results. Local checks do not establish production readiness or contest acceptance. Unit tests use synthetic values; integration tests use a real ephemeral MongoDB server. P5 browser QA exercises deployed Render; P7 exercises a separate local app against Atlas. Local real-email acceptance and founder-reported receipt now pass; deployed email/Cron and physical-device QA remain open gates. The last P6 audit retained five high development-tool advisories; P7 adds no dependency changes.

P0–P4 were committed and pushed by the founder as `32e07f8`. The founder authorized P5 publication and the smallest separate paid Cron. Release `d690810` is pushed and its hosted CI passes; P5 evidence follow-up is `cfbb19e`. P6/P7 were published with explicit founder authorization as a156994 on October 16. P8 documentation/evidence remains local pending separate commit/push authorization. No post-deadline commits exist at the P8 audit; any later commits after 2026-10-19T06:59:00Z must be listed here with their hashes, times and changes.

## Render and CI (P5)

Follow [the P5 runbook](docs/P5_DEPLOYMENT.md) for the existing service, environment matrix, Atlas allowlist, one-time owner provisioning, UTC Cron and rollback. The workflow performs a secret-free clean install, lint, types, unit/UI tests, real ephemeral MongoDB integration tests and build on push/PR. Hosted success requires an actual Actions run URL. The production start command is `npm run start:render`; set the real HTTPS APP_URL and Atlas/auth secrets privately. `/api/health` reports readiness only, never credentials or provider connectivity. Durable records/jobs/sessions remain in Atlas; raw uploads are transient and Render filesystem caches are disposable. Cron has a documented minimum US$1/month plus usage and requires founder spending approval.


## P4 email operations

See [P4 setup](docs/P4_SETUP.md) for the exact verification/opt-in/test flow and worker exit codes. `npm run reminders:process` uses Next environment precedence; `.env.local` overrides `.env`. Configure a Resend key and verified sender securely, use a private owner address you control, verify the emailed code, save explicit opt-in, then send the labelled TEST from Settings. The `.invalid` synthetic sandbox cannot receive mail. No arbitrary recipient, fake verification or due-date mutation is accepted. A non-delivering preview remains available without credentials. Provider acceptance is not delivered; no delivery receipt webhook exists. The worker runs once and exits; The separate Render Cron is configured every 15 minutes UTC; its last inspected real scheduled run exited 2/provider unavailable; current run history is unverified.

## Actual model, security and demo setup

Extraction uses Google AI Studio's OpenAI-compatible endpoint `https://generativelanguage.googleapis.com/v1beta/openai` with `GEMMA_MODEL_ID=gemma-4-26b-a4b-it`. Set `GEMMA_API_KEY` privately; protocol compatibility does not mean a GPT/Gemini substitution. Resend is the sole email adapter. Owner accounts are operator provisioned; local setup generates a labeled synthetic owner using an undeliverable .invalid address. Never expose a real owner's credentials for judging. See [walkthrough](docs/P7_DEMO_STORYBOARD.md) and [P8 publication steps](docs/P8_PUBLICATION_CHECKLIST.md).

Passwords are hashed, sealed sessions are server validated, mutations enforce origin/organization authorization, uploads are capped, and evidence validation precedes explicit confirmation. Raw uploads are transient; minimized excerpts/hash, candidate fields and audit records persist in Atlas. Hosted inference transmits document text to the provider; applicable billing-tier privacy terms are unverified. Use synthetic/permitted documents. Sentry excludes document text, private addresses and secrets. Email is at-least-once processing with duplicate suppression, not exactly-once delivery. These safeguards are not a compliance certification.

## Licensing and attribution

See [licence/attribution inventory](docs/ATTRIBUTION.md) and [model/provider tradeoffs](docs/P7_COSTS_PRIVACY_LICENSE.md). Gemma 4 uses Apache-2.0; hosted-service terms are separate. Original project code currently has **no project-wide licence grant**; public source access is not a permissive licence. Upstream dependency licences/notices remain applicable. Codex assisted code, tests and the submission draft. No public agent session or actual Copilot use is claimed.
