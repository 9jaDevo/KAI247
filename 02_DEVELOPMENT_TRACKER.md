# KAI247 AI — Development Tracker & Evidence Log

**Tracker version:** 1.0 | **Created:** 2026-10-14 | **Overall:** P7 BENCHMARK + LOCAL REAL EMAIL/WALKTHROUGH VERIFIED; VIDEO AND INDEPENDENT LABEL REVIEW PENDING; P6/P7 UNPUBLISHED
**Authoritative requirements:** `01_RENEWPILOT_MASTER_SPEC.md` | **This tracker:** `02_DEVELOPMENT_TRACKER.md` | **Execution prompts:** `03_CODEX_PHASE_PROMPTS.md`

> **THIS TRACKER IS MUTABLE.** Codex must update checkboxes, status, evidence links and blockers **after actually performing and verifying work**. Do not tick anything on the basis of intent, scaffolding alone, an unexecuted test, or simulated partner integration. Never modify the master spec unless the founder approves a versioned change. Keep a handoff note after every phase, even when blocked.

## 0. Operating rules

1. Execute **one phase per Codex prompt**. Do not start next phase until phase gate is satisfied or founder explicitly authorizes a documented exception.
2. Tasks statuses: `[ ]` Not started; `[-]` In progress or partial; `[x]` Completed and verified; `[!]` Blocked (describe in Blocker Log). A checked task must include a proof path, test output, link, or commit.
3. At phase end, Codex reports: **implemented, files changed, tests run/result, deployed URLs if any, blockers, newly identified risks, next recommended phase**. Update this tracker in the same commit.
4. Use real UTC timestamps for commits and observed tests. Dates below are **targets**, not claims about completion.
5. External-account configuration is a founder action; do not publish credentials or screenshots showing secrets. A complete phase can contain an explicit external configuration blocker only if the founder agrees to the scope of partial completion.
6. Handoffs must remain accurate even after context resets. Every prompt instructs Codex to read all three documents and this tracker first.
7. Treat every core feature as **unverified** until manually exercised or supported by automated test output. Distinguish real model/provider from mocked one in evidence.

## 1. Schedule and phase gates

| Phase            | Target date (WAT)      | Objective                                                                      | Gate to proceed                                         | Status |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- | ------ |
| **P0**           | Oct 14                 | Project kickoff, brand-new repository, workspace, specs, environment inventory | Fresh repo + docs committed + project boots             | `[x]` founder baseline committed |
| **P1**           | Oct 14                 | Premium UI and navigation, static demo states                                  | Responsive navigable pages + screenshots                | `[x]` local verified |
| **P2**           | Oct 14–15              | Auth, Atlas, manual renewal CRUD                                               | Real persistent end-to-end CRUD under owner auth        | `[x]` deployed Atlas CRUD story verified in P5 |
| **P3**           | Oct 15                 | Gemma document extraction and human approval                                   | Real Gemma extraction → evidence → approved record      | `[x]` real local + deployed TXT; PDF reliability limits retained |
| **P4**           | Oct 16                 | Email reminder engine and reliability                                          | Test email + persisted job + cancel/retry tests         | `[x]` local real TEST + founder receipt verified in P7; deployed Cron separate |
| **P5**           | Oct 16                 | Render deployment and CI                                                       | Public working URL + passing workflow + cron configured | `[!]` deployed core + CI/Cron invocation pass; real email open |
| **P6**           | Oct 17                 | Sentry traces and safety/quality hardening                                     | Sanitized traces + test evidence + errors handled       | `[x]` local + Sentry dashboard verified; uncommitted/undeployed |
| **P7**           | Oct 17–18              | Evaluation, real-user test, product demo                                       | Reproducible benchmark + demo + evidence log            | `[-]` evidence/assets prepared; video and independent human reference review pending |
| **P8**           | Oct 18                 | DEV submission and prize proof                                                 | Article published and entry verified                    | `[ ]`  |
| **S1 (stretch)** | Only after P0–P8 gates | .tech, GitHub Actions/Copilot evidence, Temporal, Entire, DO/Mastra            | Every claimed partner demonstrated                      | `[ ]`  |

**Hard cutoff:** Submit **before** Sunday Oct 18, 23:59 PDT / Monday Oct 19, 07:59 WAT. Due-date note: contest landing page may show “Live Ended” conflicting with official dated rules; founder must verify form availability earlier, not at final minute.

## 2. P0 — Kickoff, source control, and environment

**Dependencies:** Founder confirms fresh Week 2 repo and authorizes creation/connection of accounts.  
**Exit gate:** Working Next.js app boots locally, source-of-truth docs committed to **new** GitHub repo, no secrets exposed.

- [x] P0.01 — Confirm brand-new repo was created within contest entry period; record URL and creation timestamp: https://github.com/9jaDevo/KAI247 — `2026-10-14T15:44:18Z`; first commit `2026-10-14T15:44:11Z`. See `docs/evidence/p0-repository.json`, `p0-git-history.txt`, and official terms excerpt.
- [x] P0.02 — Place all 3 management Markdown files at repository root unchanged; add README links to them.
- [x] P0.03 — Initialize Next.js + TypeScript + Tailwind + lint + formatter; lock dependency versions.
- [x] P0.04 — Create folders, `.gitignore`, `.env.example`, consistent scripts (`dev`, `build`, `lint`, `typecheck`, `test`).
- [x] P0.05 — Design and document required environment variables; secret values never in git.
- [x] P0.06 — Run clean install/build/lint/typecheck, record outputs.
- [x] P0.07 — Founder committed/pushed the P0–P4 baseline as `32e07f8a1533b1d46106d4f57715203696897866`, 2026-10-15 08:13:28 UTC; verified local/remote match during P5 (`docs/evidence/p5/account-status.json`). Prior pending-commit notes are historical.

**Evidence:** https://github.com/9jaDevo/KAI247 | initial SHA: `51c5f2af008eb247340373760b3a0f0793b550d4` | boot: `docs/evidence/p0-dev.txt`, `p0-dev-http.json`. P0.02–P0.06 proof: `docs/evidence/p0-verification.md` and its command logs.  
**Known blockers:** P0.07 commit/push authorization pending; no scaffold SHA. Five high development-only advisories remain; production dependency audit has zero. **Phase status:** `[-]` — local work verified; docs-committed exit gate pending.

## 3. P1 — Product UI and UX skeleton

**Exit gate:** All routes and critical empty/loading/error states accessible, responsive and not pretending mock values are real data.

- [x] P1.01 — Define UI tokens, components (layout/sidebar/topbar/buttons/cards/forms/status badges/dialogs).
- [x] P1.02 — Build clear landing page and demo call-to-action without fabricated testimonials.
- [x] P1.03 — Build login screen and authenticated shell placeholders (real auth arrives P2).
- [x] P1.04 — Build dashboard, renewal list, manual form/details, import/review, activity, settings.
- [x] P1.05 — Realistic **labeled synthetic** fixtures, loading/empty/AI-unavailable/error states.
- [x] P1.06 — Mobile 360px / tablet 768px / desktop 1280px tests; keyboard tab order and labels.
- [x] P1.07 — Screenshots at mobile/desktop; run lint/typecheck/build.

**Evidence:** `docs/evidence/p1-verification.md`; screenshots and 33 route/viewport checks in `docs/evidence/p1/browser-report.json`; nine browser interaction groups passed with zero runtime errors. Lint/typecheck/build/format and all 15 tests passed (command logs under `docs/evidence/p1-*.txt`). **Phase status:** `[x]` — local interface verified; no real provider integration claimed.

## 4. P2 — Owner authentication, Atlas and renewal CRUD

**Exit gate:** Authenticated owner creates, edits and renews records; reload shows persisted data from Atlas; unauthorized requests fail.

- [x] P2.01 — Implement server-side owner authentication, hashed passwords, secure sessions and session expiry.
- [-] P2.02 — Atlas connection and isolated P4 job persistence/indexes verified (`docs/evidence/p4/atlas-proof.json`). Full owner CRUD app workflow on Atlas remains pending; `.env.local` still selects local MongoDB.
- [x] P2.03 — Implement `User`, `Organization`, `Renewal`, `AuditEvent`, `Extraction`, `ReminderJob` schemas/types.
- [x] P2.04 — CRUD APIs with Zod input validation, due-date parsing, organization scoping.
- [x] P2.05 — Connect dashboard/list/form/detail UI to real API data; correct overdue/due-soon calculations.
- [x] P2.06 — Implement archive and `renewed` action with version updates; audit events.
- [x] P2.07 — Integration tests for create/update/read, forbidden other-owner access, invalid date, incorrect amounts, input injection.
- [x] P2.08 — Seed only synthetic demo records, clearly tagged; no live fake metrics.

**Evidence:** `docs/evidence/p2-verification.md`; real local MongoDB 8.2.6, 20 unit/UI tests, 14 real-MongoDB integration tests, eight browser groups / 33 route-viewport checks, and DB restart + fresh HTTP read passed. Command logs and 10 screenshots under `docs/evidence/p2*`. P2.01/P2.03–P2.08 are locally verified; P2.02 pooling/index/local fallback is verified. The original P2 run had no Atlas proof; the later P4 isolated Atlas persistence/index/reconnect proof supersedes that connection blocker. The complete owner CRUD UI story against Atlas remains pending, because .env.local still selects local MongoDB. No P2 commit. **Phase status:** `[-]` — local story works; full Atlas app exit gate not met.

## 5. P3 — Real Gemma document extraction + human review

**Exit gate:** A machine-readable hosting invoice is parsed, actually submitted to Gemma, reviewed with exact source text, manually confirmed, and saved; malformed/ambiguous sources do not create records.

- [x] P3.01 — Build upload validation (TXT/PDF 5 MB, magic/type checks, auth, timeout, rate limit). `src/lib/documents/upload.ts`, `src/lib/security/rate-limit.ts`; unit `tests/unit/upload-text.test.ts`; integration 401/403/415/413/429 in `docs/evidence/p3-integration.txt`; browser 401/403 in `docs/evidence/p3-browser.txt`.
- [x] P3.02 — Text extraction from TXT / PDF text layer; scanned-only docs receive clear unsupported message. `src/lib/documents/text.ts` (unpdf 1.8.1, 15 s timeout, 30 pages); `NO_TEXT_LAYER` before any model call (unit, integration, live proof, screenshot `docs/evidence/p3/scanned-pdf-rejected-1280.png`). OCR **not** implemented.
- [x] P3.03 — Gemma adapter with env-based endpoint/model credentials; verify real model ID and usage; no hidden closed-model replacement. `src/lib/ai/gemma.ts`: `gemma-*` IDs only; provider-reported model must match (else `AI_MODEL_MISMATCH`); real usage/latency in `docs/evidence/p3/gemma-live-proof.json`.
- [x] P3.04 — Structured extraction with Zod validation and exact verifiable evidence snippets. `src/lib/ai/schema.ts`, `src/lib/ai/evidence.ts`, `src/lib/ai/validate.ts`; one bounded retry for malformed output (`src/lib/ai/extract.ts`).
- [x] P3.05 — Robust ambiguous/multiple date rules; date type classification, `DD/MM/YYYY` handling, missing date state. `src/lib/ai/date-parse.ts` + validator (issue/payment/grace/filing/competing dates, declared format, CAC wording, garbled-date repair never auto-verified); `tests/unit/date-parse.test.ts`, `extraction-validate.test.ts`.
- [x] P3.06 — Extraction review UI with editable candidate and mandatory confirmation. `/app/import`, `/app/import/[id]` (`src/components/document-import.tsx`, `extraction-review.tsx`); screenshots `docs/evidence/p3/review-*.png` at 1280/360.
- [x] P3.07 — Confirm endpoint creates Renewal; unapproved candidate creates none. `POST /api/extractions/:id/confirm|reject` (atomic, single-use, audited, P4 hook returns `deferred`/0 jobs); integration + browser run 4 (exactly +1 renewal).
- [x] P3.08 — Prompt-injection fixtures, wrong-date and no-date tests; log failures. `tests/fixtures/documents/*` (synthetic, labelled), unit + integration tests; real-model failures logged in `docs/evidence/p3-verification.md` (error analysis) and archived failed runs.
- [x] P3.09 — Record exact Gemma model + provider and one real trace/log of execution (sanitized). `gemma-4-26b-a4b-it` via Google AI Studio OpenAI-compatible endpoint; `docs/evidence/p3/gemma-live-proof.json`, `docs/evidence/p3-gemma-live.txt`, `docs/evidence/p3/browser-report.json`.

**Evidence:** AI proof model/provider: `gemma-4-26b-a4b-it` (Gemma 4, open weights, Apache 2.0) hosted by Google AI Studio `generativelanguage.googleapis.com/v1beta/openai` — model list + echoed `model` field; median 4,823 ms over 6 real calls (`docs/evidence/p3/gemma-live-proof.json`) | sample fixture: `tests/fixtures/documents/hosting-invoice-two-dates.pdf` (synthetic) | extraction output/screenshot: `docs/evidence/p3/review-invoice-1280.png`, `renewal-from-document-1280.png`; full report `docs/evidence/p3-verification.md`; setup/licence `docs/P3_SETUP.md`. Browser acceptance: 4 real runs — 2 pass, 2 safe failures (garbled date discarded; model output truncated → retry message), all kept. **Phase status:** `[x]` — exit gate met locally with real Gemma and real local MongoDB; not Atlas, not deployed, not production-mode (guards require HTTPS + Atlas).

## 6. P4 — Email reminders and durable scheduling

**Exit gate:** Approved renewal creates scheduled jobs, authorized user receives a real test email, retry/cancel/idempotency logic is tested.

- [x] P4.01 — Persisted timezone/offset/time/opt-in settings and owner-only mailbox proof flow; synthetic integration proof in docs/evidence/p4-integration.txt. Actual mailbox verification is blocked with P4.05/06.
- [x] P4.02 — Pure deterministic Temporal calendar planner; defaults 30/7/1/0, Lagos 09:00; leap/DST/date-line/exact-day/catch-up tests in tests/unit/reminder-planner.test.ts.
- [x] P4.03 — Persistent jobs, unique idempotency index, settings revision and renewal version, transactional claims and fenced leases. Real Atlas synthetic jobs/reconnect/index evidence: docs/evidence/p4/atlas-proof.json; claim/recovery tests: p4-integration.txt.
- [x] P4.04 — One-shot CLI (25-job batch), closes client and exits; no web timer. Actual unavailable run exits 2 with zero sends: docs/evidence/p4-worker-unconfigured.txt. Cron deployment is P5.
- [x] P4.05 — Original P4 configuration blocker superseded during P7: real Resend mailbox-verification and single TEST accepted using founder-configured credentials. Synthetic 429/500/permanent-error coverage still passes; no provider plan/DNS-dashboard audit claimed.
- [x] P4.06 — P7: founder privately supplied own mailbox, mailbox proof succeeded, opt-in saved, actual owner-only TEST accepted 2026-10-16 12:51 UTC and founder replied “Received and clearly labeled TEST”. App remains provider_accepted (no webhook). `docs/evidence/p7/{walkthrough-stages.json,founder-receipt.json,05-real-test-activity.png}`. No deployed Cron send claim.
- [x] P4.07 — Real organization-scoped activity with attempted/pending/claimed/provider_accepted/failed/cancelled and safe error history; no code writes delivered without receipt. Six browser viewport checks and screenshots: docs/evidence/p4/.
- [x] P4.08 — 41 total native-MongoDB integration tests (16 added P4) and 80 total unit/UI tests (17 added P4): idempotency, parallel claims, separate-process exit/recovery, 429/500 retry, invalid recipient, bounded retry horizon, renewal/archive/opt-out cancellation, no duplicate burst; calendar rollover tests.

**Original P4 evidence:** docs/P4_SETUP.md; docs/evidence/p4-verification.md and p4 command logs. At that phase close real send was blocked. **P7 superseding evidence:** actual mailbox proof, opted-in TEST, provider acceptance + founder receipt attestation, versioned jobs/cancellation in `docs/evidence/p7-verification.md`. No private inbox screenshot or delivery webhook claimed. **Current local phase gate:** `[x]`; deployed Cron/provider validation remains a P5 release gate. Historical P4 report is retained unchanged.

## 7. P5 — Render deployment and continuous integration

**Exit gate:** Public Render URL operates against Atlas/real Gemma and reminder processor configured; green CI.

- [x] P5.01 — Real push/PR/manual GitHub Actions CI published at d690810; run 38855395748 passed install/lint/types/93 unit/41 real-MongoDB integration/build. https://github.com/9jaDevo/KAI247/actions/runs/38855395748; screenshot and JSON saved.
- [x] P5.02 — Existing Render web srv-db8qvg6q1p3s73931peg deployed release d690810. Corrected deployment dep-db8rfuui0phs738ou2sg is Live; npm ci/build, start:render, 0.0.0.0:10000 and safe /api/health. No web tier change.
- [x] P5.03 — Separate kai247-reminders Cron crn-db8raion74is73chvv40 configured every 15 minutes UTC, npm run reminders:process; build succeeded and actual scheduled invocation observed 2026-10-16 05:30 UTC. Exit 2/providerUnavailable, zero processed/sent: delivery remains blocked. Founder approved smallest paid compute, US$0.00016/active minute, minimum US$1/month.
- [x] P5.04 — HTTPS APP_URL configured and startup guard passes; public DB-backed health 200, unauthenticated API 401, actual HTTPS Secure/HttpOnly/SameSite cookie checks pass. AUTH_SECRET privately entered by founder, never revealed. Failed HTTP-origin deployments preserved.
- [!] P5.05 — Deployed Atlas owner CRUD/edit/renew/history + real Gemma TXT pending review/explicit browser approval/reload pass. Two PDF calls fail safely with MODEL_OUTPUT_INVALID; TXT initial invalid test category rejected then corrected via UI. Real TEST email blocked: provider unavailable and no verified opted-in private owner. Zero sent.
- [x] P5.06 — Durable state in Atlas, uploads transient in memory, no web timers/disk dependency. Public HTTPS readback and real browser reload retain manual version 3/history and document-approved renewal; CI/Render/live screenshots saved.

**Evidence:** https://kai247.onrender.com; CI https://github.com/9jaDevo/KAI247/actions/runs/38855395748; `docs/evidence/p5/live-acceptance.json`, `render-release.json`, real screenshots, retained failure reports; `docs/P5_DEPLOYMENT.md`, `docs/evidence/p5-verification.md`. Release d690810f70b5ed4b61e20eba2182d51d388f2b9e committed/pushed with authorization; evidence follow-up cfbb19ef38814d2a25f8bc7eaca2388e2f9fdd51. **Phase status:** `[!]` — public core and scheduled invocation verified; real email gate remains open despite subsequently supplied configuration. P6 evidence is separate below.

## 8. P6 — Sentry, resilience and safeguards

**Exit gate:** Real sanitized AI traces visible; failures handled clearly; core security tests pass.

- [x] P6.01 — Sentry 11.8.0 installed/configured for Node server errors and AI step spans; actual external ingestion verified.
- [x] P6.02 — Trace `parse_document`, `gemma_extract`, `validate_candidate`, owner confirmation (`approve_renewal`, the `confirm_record` step), `queue_reminder`, `send_email`; privacy allowlist strips document/PII/request data.
- [x] P6.03 — Actual duration, provider input/output token counts, attempt and curated failure flags; bounded retries/timeouts tested. Default trace sampling 0.1.
- [x] P6.04 — Actual Sentry waterfall/model/failure screenshots saved. One real Gemma span 5.74s, 1007/204 tokens; longest observed extraction step, not a benchmark.
- [x] P6.05 — 42 real-MongoDB integration tests plus 101 unit tests pass; auth, org isolation/IDOR, upload bounds/parser, CSRF, malicious evidence, rate limits and telemetry canaries. Nine actual production-build HTTP checks pass locally.
- [x] P6.06 — 360px loaded screen checks; 768/1280px form checks. Escape closes navigation/restores focus; login error associated with inputs; empty state screenshot.
- [x] P6.07 — Shared request-body deadline, exact model identity and safe usage validation. Introduced scheduling brace regression caught/fixed; failed log retained and full integration rerun passes.

**Evidence:** [P6 report](docs/evidence/p6-verification.md), [setup](docs/P6_OBSERVABILITY.md), [actual Sentry trace](https://tog-africa.sentry.io/explore/traces/trace/7512242656ca4d34a78153a27ee5aa7e/), `docs/evidence/p6/{real-traces.json,sentry-waterfall.png,sentry-gemma.png,sentry-synthetic-email-failure.png,browser-report.json,http-smoke.json}` and command logs. **Phase status:** `[x]` local implementation + genuine Sentry visibility; P6 not committed/pushed/deployed. Synthetic failures are explicitly labeled; no real email sent. P5 email and production P6 telemetry gates remain open.

## 9. P7 — Evaluation, field validation and demo

**Exit gate:** Benchmark reproducible, real observations recorded, credible video/demo recorded and reviewed.

- [x] P7.01 — 16 frozen synthetic texts and explicit reference labels in `tests/fixtures/benchmark/p7/dataset.json`; dataset hash in both runs. Hand-authored by implementation agent before inference, not independently human annotated. Founder/domain-expert review pending and disclosed.
- [x] P7.02 — Real app Gemma adapter/prompt/schema/evidence validator vs fixed first-date/first-amount comparator; two full unchanged 16-case runs, JSON/CSV/all failures retained. Ten exact field counts and strict-all criterion, no LLM judge. `docs/evidence/p7/run-{01,02}/`.
- [x] P7.03 — Original: 2 outputs, 3 timeouts, 11 unavailable; repeat: 15 outputs, 1 malformed-output failure. Strict 2/16 then 10/16 vs baseline10/16. All-attempt medians 674.5ms (fast-error dominated) and6101ms; successful-only52962ms/n2 and6091ms/n15. P95 withheld per16-case small sample. Method and 7 specific failure analyses retained.
- [ ] P7.04 — Interview questions prepared. Founder identified an IT-provider role but gave no feedback wording and requested deferral. No quote, interview result, willingness-to-pay or payment claimed. `docs/P7_COMMERCIAL_HYPOTHESIS.md`.
- [-] P7.05 — 2:40 storyboard, ten real browser screenshots including a retained defect, real Atlas/model/email evidence and exact founder recording steps prepared. **No video recorded/uploaded**; direct recording unavailable. User-authorized screenshot/storyboard fallback delivered; recording/review/URL remain founder work.
- [-] P7.06 — Local synthetic import→review/edit→explicit approval→renewal/jobs→real verified TEST→renew/reload passes. Misleading scheduling copy and replacement-date provenance fixed and tested. No new deployed P6/P7 verification or Cron email delivery; benchmark provider failures prevent blanket reliability claims.
- [x] P7.07 — Commercial/price hypothesis (not launched billing), consent-safe interview questions, model licence/provider privacy and observed costs/unknown invoices documented. No new spending or account plan changes.

**Evidence:** [P7 verification](docs/evidence/p7-verification.md), [methodology](docs/P7_METHODOLOGY.md), [results/failure analysis](docs/evidence/p7-benchmark-analysis.md), [storyboard](docs/P7_DEMO_STORYBOARD.md), [commercial questions](docs/P7_COMMERCIAL_HYPOTHESIS.md), [cost/privacy/licence](docs/P7_COSTS_PRIVACY_LICENSE.md). **Phase status:** `[-]` evidence package and local walkthrough verified; actual video, independent human label review and optional feedback remain pending. No video URL, deployment or submission invented. P8 not started.

## 10. P8 — Contest submission and proof checklist

**Exit gate:** Published DEV post uses official template; verified accessible URLs; only claimed integrations evidenced.

- [ ] P8.01 — Use official Week 2 DEV submission template, English, with required `#devchallenge` and `#hf26challenge` tags.
- [ ] P8.02 — Headline describes actual problem; explain why target customer might pay and compare fairly with calendar reminders.
- [ ] P8.03 — Include GitHub code link, working demo URL or video, model/provider identity and genuine deployment evidence.
- [ ] P8.04 — Include real tests, edge cases, failures, corrective work and limitations.
- [ ] P8.05 — Explain concretely why open-weight Gemma mattered (control, portability, possible cost/privacy gains without unmeasured claims).
- [ ] P8.06 — Choose prize categories ONLY with passing evidence entries below; link/screenshots.
- [ ] P8.07 — Attribution/open-source dependencies/license and no copied prior contest project.
- [ ] P8.08 — Confirm project and repo creation timestamps within contest window; avoid committing after deadline without noting it.
- [ ] P8.09 — **Publish and verify** article appears as submitted in contest before deadline. Preserve final published URL and timestamp.

**Evidence:** DEV post URL `TBD` | submission confirmation `TBD` | submission timestamp `TBD`. **Phase status:** `[ ]`.

## 11. S1 — Optional category expansion (never block P8)

- [ ] S1.01 — Live .tech domain through Hacktoberfest promo linked in article; DNS/HTTPS works and renewal pricing documented.
- [ ] S1.02 — Genuine GitHub Actions automation run; link and screenshots for Copilot category rules, if applicable.
- [ ] S1.03 — Capture/share real agent sessions using Entire and reference them in write-up, if available.
- [ ] S1.04 — Replace or complement cron with *working* Temporal workflow; test crash/restart recovery, retried activity and inspection; no duplicate reminders.
- [ ] S1.05 — Run actual Gemma inference on DigitalOcean with operational evidence only if effort/budget appropriate.
- [ ] S1.06 — Use Mastra to orchestrate nontrivial useful extraction workflow if it improves actual product.

**Stop condition:** If any stretch task threatens P0–P8 quality or deadline, defer and document it as post-hackathon.

## 12. Partner prize evidence register — fill in, never invent

| Category             | Intended role                      | Real integration? | Evidence URL/path | Eligible to claim? |
| -------------------- | ---------------------------------- | ----------------- | ----------------- | ------------------ |
| Gemma | Structured document extraction | Yes — real Gemma-4-26b-a4b-it local/deployed TXT and two complete real benchmark attempts over16 frozen synthetic docs | docs/evidence/p7/run-01/, run-02/; docs/evidence/p7-benchmark-analysis.md; prior P3/P5 proof | Technical benchmark evidence present, poor first-run availability retained; independent human references and final P8 category review pending, no prize qualification guaranteed |
| Render | Existing web + separate scheduled Cron | Yes — d690810 deployed; actual scheduled worker invoked, provider unavailable | https://kai247.onrender.com; docs/evidence/p5/render-release.json, render-cron-provider-unavailable.png | No complete reminder-delivery claim |
| MongoDB Atlas | Persistent DB | Yes — isolated synthetic P4 planner jobs, transaction/index/reconnect | docs/evidence/p4/atlas-proof.json | Deployed owner app workflow now passes (p5/live-acceptance.json); no automatic prize eligibility claim |
| Sentry Agent Tracing | Instrumented AI pipeline | Yes — actual SDK spans + real Gemma, safe model/tokens/duration, explicitly synthetic failures visible in Sentry | docs/evidence/p6-verification.md; docs/evidence/p6/sentry-gemma.png; https://tog-africa.sentry.io/explore/traces/trace/7512242656ca4d34a78153a27ee5aa7e/ | Technical evidence available; P6 unpublished, final category terms/submission acceptance not claimed |
| .tech Domain         | Public production URL              | No                | —                 | No                 |
| GitHub Copilot       | CI automation / actual allowed use | No                | —                 | No                 |
| Entire               | Coding-agent session evidence      | No                | —                 | No                 |
| Temporal             | Durable reminder workflow          | No                | —                 | No                 |
| DigitalOcean         | Deployed model infrastructure      | No                | —                 | No                 |
| Mastra               | Orchestrated AI workflow           | No                | —                 | No                 |

**Interpretation:** `No` here means *not verified at tracker creation*, not that the service cannot be used. Update only after passing a real test.

## 13. Tests, security and documentation ledger

| Evidence                   | File / URL | Outcome       | Last checked |
| -------------------------- | ---------- | ------------- | ------------ |
| Lint | docs/evidence/p3-lint.txt | Pass; zero warnings | 2026-10-14 20:11 UTC |
| Typecheck | docs/evidence/p3-typecheck.txt | Pass | 2026-10-14 20:11 UTC |
| Unit tests | docs/evidence/p3-test.txt | Pass; 63 tests (20 P2 + 43 P3; mock model answers labelled synthetic) | 2026-10-14 20:11 UTC |
| Integration tests | docs/evidence/p3-integration.txt | Pass; 25 tests on real isolated MongoDB (Gemma transport mocked, labelled) | 2026-10-14 20:11 UTC |
| Build | docs/evidence/p3-build.txt | Pass | 2026-10-14 20:11 UTC |
| Gemma extraction real call | docs/evidence/p3/gemma-live-proof.json; docs/evidence/p3-browser.txt | Pass; `gemma-4-26b-a4b-it`, 6 real calls, median 4,823 ms; browser acceptance 2 pass / 2 safe failures (all kept) | 2026-10-14 20:06 UTC |
| P3 browser workflow (real Gemma) | docs/evidence/p3/browser-report.json | Pass (run 4): upload → pending → evidence → edit/approve → reload; ambiguous/injection/no-date/scanned safe | 2026-10-14 20:06 UTC |
| Production-mode P3 smoke | docs/evidence/p3-prod-smoke.txt | Blocked by design locally (HTTPS + Atlas required); deferred to P5 | 2026-10-14 20:08 UTC |
| Baseline benchmark | docs/evidence/p7/run-01/REPORT.md; run-02/REPORT.md | Executed16 docs twice; strict2/16 then10/16 vs regex10/16; all errors retained | 2026-10-16 UTC |
| Reminder real email | docs/evidence/p7/walkthrough-stages.json; founder-receipt.json; 05-real-test-activity.png | Pass locally: one real opted-in verified-owner TEST accepted; founder confirmed receipt/TEST label. No webhook/deployed Cron claim | 2026-10-16 UTC |
| P4 worker recovery | docs/evidence/p4-integration.txt | Pass; child process exits after claim, later process recovers lease; Render Cron not configured | 2026-10-15 UTC |
| Unauthorized access test | docs/evidence/p2-integration.txt | Pass; missing/forged/expired/revoked and cross-owner cases | 2026-10-14 UTC |
| 360px responsiveness | docs/evidence/p1/browser-report.json | Pass; 11 routes at 360/768/1280px | 2026-10-14 UTC |
| UI browser workflows | docs/evidence/p2/browser-report.json | Pass; eight groups including persistent CRUD/renewal | 2026-10-14 UTC |
| Live Render smoke test | docs/evidence/p5/live-acceptance.json | HTTPS auth/Atlas CRUD/renew/history, actual Gemma TXT + browser approval/readback pass; PDF failures and email blocker retained | 2026-10-16 UTC |
| Sentry trace | docs/evidence/p6/real-traces.json; sentry-waterfall.png; sentry-gemma.png; sentry-synthetic-email-failure.png | Pass: actual real-model trace visible; labeled synthetic failures; zero real email | 2026-10-16 UTC |
| Demo video | docs/P7_DEMO_STORYBOARD.md; docs/evidence/p7/*.png | Storyboard/screenshots ready, not recorded; exact founder steps supplied | 2026-10-16 UTC |
| DEV published entry        | TBD        | Not published | —            |

P4 latest executed checks: **80 unit/UI tests, 41 integration tests, lint/typecheck/build/format passed** (p4 command logs). Browser: eight check groups, six route/viewport combinations, six screenshots, zero runtime errors. Atlas: four synthetic jobs, unique index and reconnect passed. Real email: blocked, zero sent. Prior P3 ledger rows remain historical.

P6 latest executed checks: **101 unit tests / 14 files, 42 integration tests / 3 files**, lint/typecheck/build/format pass; command logs `docs/evidence/p6-*.txt`. Actual production-build local HTTP smoke: 9 passed checks, Atlas readback/auth/origin/IDs/cookie flags. Browser: loaded mobile screens, tablet/desktop form, visible keyboard focus and generic login failure. Real Gemma and explicit approval on isolated synthetic Atlas DB pass; 11 real Sentry spans and sanitized error accepted and visibly inspected. No P6 deployment, hosted P6 CI or real email claim. Failed scheduling and generated-types-race logs retained in `docs/evidence/p6/`. Audit: 5 existing high development-lint advisories, zero critical/runtime advisories reported.

## 14. Blocker and decision log

| Date/Time WAT | Phase | Blocker / decision                                   | Owner   | Workaround / action                            | State |
| ------------- | ----- | ---------------------------------------------------- | ------- | ---------------------------------------------- | ----- |
| 2026-10-14 | P0 | Provider credentials not needed for P0 | Founder | Supply securely only as later phases require | Deferred |
| 2026-10-14 17:20 WAT / 16:20 UTC | P0 | Commit/push authorization pending under shared instructions | Founder | Review local result; authorize focused Git publication | Pending |
| 2026-10-14 17:20 WAT / 16:20 UTC | P0 | Five high development-only lint dependency advisories; deprecated ESLint 9 satisfies plugin peer ranges | Engineer | Revisit compatible patches before deployment; production audit zero | Open |
| 2026-10-14 17:56 WAT / 16:56 UTC | P1 | Explicit founder request authorizes P1 with P0 commit gate pending | Founder | P0/P1 Git publication still requires explicit authorization | Recorded |
| 2026-10-14 19:04 WAT / 18:04 UTC | P2 | Atlas URI/credentials absent; local fallback explicitly authorized by P2 prompt | Founder | Configure development Atlas securely, then request P2 round-trip verification | Blocked |
| 2026-10-14 19:04 WAT / 18:04 UTC | P2 | Local story passed, but no Git publication authorization | Founder | Review source/evidence; authorize a focused commit/push separately | Pending |
| 2026-10-14 20:10 WAT / 19:10 UTC | P3 | Explicit founder P3 prompt authorizes P3 while P2 Atlas gate is blocked (same exception pattern as P1) | Founder | P3 verified on local MongoDB; Atlas round trip still required for P2/P5 | Recorded |
| 2026-10-14 20:20 WAT / 19:20 UTC | P3 | Gemma provider decision: founder-configured Google AI Studio OpenAI-compatible endpoint serving open-weight `gemma-4-26b-a4b-it` (Apache 2.0). Hosted, not local. Unpaid-tier terms allow Google product use/human review of content; key tier not verified | Founder | Synthetic/permitted documents only until paid tier or self-hosted Gemma; see docs/P3_SETUP.md | Open |
| 2026-10-14 21:00 WAT / 20:00 UTC | P3 | Intermittent real-model faults: whitespace degeneration → invalid/truncated JSON; corrupted dates/quotes inside valid JSON | Engineer | One bounded retry, max_tokens 1024, deterministic evidence/date checks, transparent garbled-date repair (never auto-verified); reassess in P7 benchmark | Mitigated |
| 2026-10-14 21:08 WAT / 20:08 UTC | P3 | `next start` smoke cannot run locally: production guards require HTTPS APP_URL + Atlas (by design) | Founder/Engineer | Verify bundled PDF/Gemma path on Render in P5 | Deferred |
| 2026-10-14 21:10 WAT / 20:10 UTC | P3 | Extraction contract extended additively with `other_dates[]` (typed: invoice_issue, payment_due, grace_period_end, filing, service_start, expiry, renewal, other) to satisfy §F rule 2/3 classification; spec fields unchanged | Engineer | Founder may confirm or request a versioned spec amendment | Recorded |

| 2026-10-15 UTC | P4 | Founder explicitly requested P4 with earlier Atlas app gate pending; .env Atlas URI exists and connection/persistence now pass | Engineer | Separate synthetic evidence database; no existing production records read or modified. Local app still uses .env.local | Recorded |
| 2026-10-15 UTC | P4 | EMAIL_API_KEY / EMAIL_FROM blank; no verified real recipient | Founder | Configure Resend verified sender/key securely, use private owner mailbox, verify code and save explicit opt-in, then authorized TEST | Blocked |
| 2026-10-15 UTC | P4 | External acceptance is not delivery; cancellation cannot recall an in-flight provider request | Engineer | Stable provider key/payload, 20h retry horizon, two-minute fenced leases, real attempt history; no delivered status written | Documented |

P6 decisions (2026-10-16 UTC): founder supplied Sentry configuration and reconnected Chrome; actual external trace visibility verified. Five existing development-lint advisories retained rather than forcing an incompatible Next14 config downgrade. P6 publication is pending separate founder authorization; no infrastructure spending added. Real-email/Cron-provider acceptance gate stays open. Failed reminder regression and generated-types race are retained alongside passing reruns. Final credential-value scan and `git diff --check` pass; master/prompts unchanged (`docs/evidence/p6/final-review.json`).

P7 latest executed checks (2026-10-16 UTC): 106 unit tests/15 files,42 real-MongoDB integration tests/3 files,lint/typecheck/build/format pass; p7 command logs. Sixteen frozen synthetic docs ran twice through real Gemma: original2 candidates/14 errors, repeat15 candidates/1 malformed-output failure; strict2/16 then10/16 vs baseline10/16. All scores reproduced from hashes. Actual local Atlas/browser import→approval→jobs→one verified opted-in TEST→renew/reload passes; founder attested receipt and TEST label. Provenance defect fixed/tested; screenshots/staged readbacks retain original failure. Cleanup verified owner opted out,12 cancelled renewal jobs,1 accepted TEST,zero pending. No actual video, substantive feedback, independent human labels, new deployment or publication. See docs/evidence/p7-verification.md.

## 15. Latest Codex handoff (replace after each phase)

**Last phase attempted:** P7 only. Reproducible benchmark, failure analyses, actual browser/Atlas/Gemma/real owner email walkthrough and demo assets prepared. Broad P7 status partial: actual video/review and independent human annotation remain pending; user feedback explicitly deferred. P8 not started.
**Current branch / publication:** main; P5 baseline cfbb19ef38814d2a25f8bc7eaca2388e2f9fdd51. Founder explicitly requested P6/P7 commit and push on 2026-10-16. The reviewed source and sanitized evidence are included in this publication; the exact SHA is recorded in Git history and the completion response. Earlier phase-close notes describe the pre-publication state. Hosted CI/Render deployment verification remains pending. No paid plan changes or new services authorized by this release.
**Benchmark:** tests/fixtures/benchmark/p7/dataset.json, SHA25666a9425f89b9cfa28da79cf87ecfb65ad83e221c40ec7926c54cba83d6012eed;16 entirely synthetic texts, references hand-authored before inference by implementation agent, not independently human labeled. Two complete unchanged runs,32 document attempts/33 real model calls. Scripts benchmark-p7.mjs and report-p7.mjs; raw JSON/CSV/attempts plus reports under docs/evidence/p7/run-01 and run-02. No selective case rerun or prompt/model/validator/scoring tuning.
**Measured results:** original2/16 completed and strictly correct,3 timeouts+11 unavailable; full repeat15/16 completed,10/16 strictly all-ten-fields correct,1 MODEL_OUTPUT_INVALID after bounded retry. Baseline strict10/16 both runs. Repeat date14/16 vs baseline12/16. Original all-attempt median674.5ms dominated by fast failures; successful median52962ms/n2. Repeat median6101ms/all16,6091ms/n15 successful. P95 withheld per small16-case sample. Seven concrete failure analyses, model/source hashes, reported usage and metric limits in docs/evidence/p7-benchmark-analysis.md and docs/P7_METHODOLOGY.md.
**Real walkthrough:** founder privately supplied controlled owner mailbox; actual Resend verification, proof and explicit opt-in saved in separate isolated P7 Atlas workspace. Browser imported synthetic walkthrough-hosting.txt → real Gemma24360ms,952/195 tokens → source/evidence review/title edit → explicit approval → version1 and4 jobs at Lagos09:00. Single real owner-only TEST accepted12:51UTC; founder replied Received and clearly labeled TEST. App remains provider_accepted, no webhook/inbox screenshot claim. Browser renew/reload/cancellation proven; screenshots and scoped readbacks in docs/evidence/p7/.
**Defect and fix:** replacement date incorrectly inherited document_confirmed and old excerpt. Failure screenshot/version2 readback retained. Existing renew service now marks new date manual, clears obsolete current-source fields, retains original Extraction/history. Regression assertions pass. Second synthetic cycle verifies version3/manual,2029-10-21,8 obsolete jobs cancelled+4 legitimate pending before cleanup. No real purchase/payment; no historical production migration. Stale inactive-scheduling copy corrected in review/detail.
**Cleanup:** initial browser opt-out did not persist; failed readback retained. Existing validated settings service then opted out only the isolated P7 owner; final readback verifies12 cancelled renewal jobs,1 accepted TEST,0 pending/claimed. Local private scripts/credentials under ignored .local; task-owned port3017 dev server stopped before typecheck/build, founder port3000 untouched. Browser viewport reset; visible final page is a static local review until restarted.
**Verification actually run:** npm test106/15; npm run test:integration42/3 (real ephemeral MongoDB, labeled model/email transports); lint/typecheck/build/format all pass after provenance fix. Offline score reproduction succeeds for both full datasets. A premature report call correctly rejected incomplete15-case checkpoint. Ten browser screenshots,360px no document overflow, actual local reload. No P7 clean-install, hosted CI, deployment or production Cron claim.
**Deliverables:** scripts/benchmark-p7.mjs, scripts/report-p7.mjs, scripts/benchmark/p7-core.mjs;16-fixture manifest/annotation policy and synthetic walkthroughTXT;5 scorer-integrity tests; targeted review/detail/renew service fix and extraction integration assertions; README/tracker; docs/P7_METHODOLOGY.md, P7_COMMERCIAL_HYPOTHESIS.md, P7_COSTS_PRIVACY_LICENSE.md, P7_DEMO_STORYBOARD.md; p7 reports/CSV/JSON/logs/screenshots. P6 edits and founder .env.example changes preserved.
**Commercial/feedback/video:** NGN2500/owner/month research hypothesis with proposed25 items, masters free-five hypothesis retained; no quotas/billing/payment implemented or validated. Interview questions/consent ledger ready. Founder supplied only IT-provider role, then deferred wording; no quote or customer/payment claim. 2:40 storyboard and exact capture/export/upload/review steps supplied; no recording tool available, no video recorded or URL invented.
**Remaining gates:** independent founder/domain-expert label review; actual video/review/accessible URL; optional permitted interview; authorization to publish/deploy P6/P7. Local real email closes P4 acceptance but deployed Render Cron EMAIL configuration/send remains unverified. Deployed P6 Sentry and these P7 fixes unverified. Previously renewed document records may need provenance review at release; no production data rewrite performed. Last P6 audit:5 high development-lint advisories, no P7 dependency changes. Hosted reliability/semantic amount issues remain; no claim of AI uniformly beating rules.
**Next phase:** P8 only on explicit new request, with evidence limitations and unresolved release gates disclosed. No article/submission/extra partner integrations started. STOP at P7. Locked master/prompts untouched; final-review.json records exact hashes and credential scan.

---
**Do not mark any item checked solely because a generated code snippet looks plausible. Run, inspect, and capture evidence.**
