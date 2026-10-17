# KAI247 AI — Development Tracker & Evidence Log

**Tracker version:** 1.0 | **Created:** 2026-10-14 | **Overall:** P8 ARTICLE/EVIDENCE PREPARED; DEPLOYED CORE + CI VERIFIED; DEV ACCOUNT MISMATCH BLOCKS PUBLICATION; NOT SUBMITTED
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
| **P6**           | Oct 17                 | Sentry traces and safety/quality hardening                                     | Sanitized traces + test evidence + errors handled       | `[x]` source published a156994; Sentry project proof verified; production trace visibility open |
| **P7**           | Oct 17–18              | Evaluation, real-user test, product demo                                       | Reproducible benchmark + demo + evidence log            | `[-]` evidence/assets prepared; video and independent human reference review pending |
| **P8**           | Oct 18                 | DEV submission and prize proof                                                 | Article published and entry verified                    | `[-]` article/checklist prepared; publication blocked |
| **S1 (stretch)** | Only after P0–P8 gates | .tech, GitHub Actions/Copilot evidence, Temporal, Entire, DO/Mastra            | Every claimed partner demonstrated                      | `[!]` preflight deferred: P5/P7/P8 gates remain open |

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
**Current P8 audit:** P0 commit gate was satisfied by the founder baseline and later authorized releases. Five development-lint advisories were retained at the last security audit; no new production audit is inferred. **Phase status:** `[x]`. Original P0 report remains historical.

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
- [x] P2.02 — Original local fallback/Atlas blocker superseded by deployed P5 owner CRUD and fresh P8 HTTPS Atlas create/edit/renew/readback; docs/evidence/p8/live-smoke.json.
- [x] P2.03 — Implement `User`, `Organization`, `Renewal`, `AuditEvent`, `Extraction`, `ReminderJob` schemas/types.
- [x] P2.04 — CRUD APIs with Zod input validation, due-date parsing, organization scoping.
- [x] P2.05 — Connect dashboard/list/form/detail UI to real API data; correct overdue/due-soon calculations.
- [x] P2.06 — Implement archive and `renewed` action with version updates; audit events.
- [x] P2.07 — Integration tests for create/update/read, forbidden other-owner access, invalid date, incorrect amounts, input injection.
- [x] P2.08 — Seed only synthetic demo records, clearly tagged; no live fake metrics.

**Evidence:** `docs/evidence/p2-verification.md`; real local MongoDB 8.2.6, 20 unit/UI tests, 14 real-MongoDB integration tests, eight browser groups / 33 route-viewport checks, and DB restart + fresh HTTP read passed. Command logs and 10 screenshots under `docs/evidence/p2*`. P2.01/P2.03–P2.08 are locally verified; P2.02 pooling/index/local fallback is verified. The original P2 run had no Atlas proof; the later P4 isolated Atlas persistence/index/reconnect proof supersedes that connection blocker. The original P2 Atlas gap was later closed by deployed P5 and fresh P8 actual owner CRUD/readback. **Current phase status:** `[x]`; historical P2 report retained.

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

- [x] P4.01 — Persisted timezone/offset/time/opt-in settings and owner-only mailbox proof flow; synthetic integration proof in docs/evidence/p4-integration.txt. Actual mailbox verification subsequently passed in the isolated P7 walkthrough.
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

**Evidence:** [P6 report](docs/evidence/p6-verification.md), [setup](docs/P6_OBSERVABILITY.md), [actual Sentry trace](https://tog-africa.sentry.io/explore/traces/trace/7512242656ca4d34a78153a27ee5aa7e/), `docs/evidence/p6/{real-traces.json,sentry-waterfall.png,sentry-gemma.png,sentry-synthetic-email-failure.png,browser-report.json,http-smoke.json}` and command logs. **Phase status:** `[x]` implementation + genuine Sentry project visibility; source published a156994, deployed pipeline/provenance behavior verified in P8. Production Sentry trace visibility itself remains unverified. Synthetic failures are explicitly labeled; no real email sent. P5 email and production P6 telemetry gates remain open.

## 9. P7 — Evaluation, field validation and demo

**Exit gate:** Benchmark reproducible, real observations recorded, credible video/demo recorded and reviewed.

- [x] P7.01 — 16 frozen synthetic texts and explicit reference labels in `tests/fixtures/benchmark/p7/dataset.json`; dataset hash in both runs. Hand-authored by implementation agent before inference, not independently human annotated. Founder/domain-expert review pending and disclosed.
- [x] P7.02 — Real app Gemma adapter/prompt/schema/evidence validator vs fixed first-date/first-amount comparator; two full unchanged 16-case runs, JSON/CSV/all failures retained. Ten exact field counts and strict-all criterion, no LLM judge. `docs/evidence/p7/run-{01,02}/`.
- [x] P7.03 — Original: 2 outputs, 3 timeouts, 11 unavailable; repeat: 15 outputs, 1 malformed-output failure. Strict 2/16 then 10/16 vs baseline10/16. All-attempt medians 674.5ms (fast-error dominated) and6101ms; successful-only52962ms/n2 and6091ms/n15. P95 withheld per16-case small sample. Method and 7 specific failure analyses retained.
- [ ] P7.04 — Interview questions prepared. Founder identified an IT-provider role but gave no feedback wording and requested deferral. No quote, interview result, willingness-to-pay or payment claimed. `docs/P7_COMMERCIAL_HYPOTHESIS.md`.
- [-] P7.05 — 2:40 storyboard, ten real browser screenshots including a retained defect, real Atlas/model/email evidence and exact founder recording steps prepared. **No video recorded/uploaded**; direct recording unavailable. User-authorized screenshot/storyboard fallback delivered; recording/review/URL remain founder work.
- [-] P7.06 — Local synthetic import→review/edit→explicit approval→renewal/jobs→real verified TEST→renew/reload passes. Misleading scheduling copy and replacement-date provenance fixed and tested. P8 now verifies deployed core and replacement provenance; production email/Cron delivery remains unverified. Benchmark provider failures prevent blanket reliability claims.
- [x] P7.07 — Commercial/price hypothesis (not launched billing), consent-safe interview questions, model licence/provider privacy and observed costs/unknown invoices documented. No new spending or account plan changes.

**Evidence:** [P7 verification](docs/evidence/p7-verification.md), [methodology](docs/P7_METHODOLOGY.md), [results/failure analysis](docs/evidence/p7-benchmark-analysis.md), [storyboard](docs/P7_DEMO_STORYBOARD.md), [commercial questions](docs/P7_COMMERCIAL_HYPOTHESIS.md), [cost/privacy/licence](docs/P7_COSTS_PRIVACY_LICENSE.md). **Phase status:** `[-]` evidence package and local walkthrough verified; actual video, independent human label review and optional feedback remain pending. No video URL, deployment or submission invented. P8 preparation and audit follow below; publication remains blocked.

## 10. P8 — Contest submission and proof checklist

**Exit gate:** Published DEV post uses official template; verified accessible URLs; only claimed integrations evidenced.

- [x] P8.01 — Current official template retrieved from challenge button; complete English draft uses required tags. docs/P8_DEV_ARTICLE.md; official-template evidence.
- [x] P8.02 — Concrete renewal-date problem, customer/payment hypothesis and fair calendar comparison; no fabricated feedback/payment.
- [x] P8.03 — Public Render/source/real model/CI/proof links; fresh deployed HTTPS API and actual browser readback. docs/evidence/p8/.
- [x] P8.04 — Both full benchmarks, failures, provenance repair, 106 unit/42 integration tests and final command logs; limitations retained.
- [x] P8.05 — Open-weight portability rationale, hosted inference/privacy and unmeasured benefits explicitly separated.
- [x] P8.06 — Current terms reviewed: Gemma, Render, Atlas, Sentry and GitHub Actions route of Copilot category supported; no actual Copilot usage or award guarantee.
- [-] P8.07 — Dependency/model attribution and absence of project-wide licence honestly documented; founder licence decision pending. No independent provenance certification.
- [x] P8.08 — Fresh GitHub creation metadata and all commit timestamps within official Oct12 19:00UTC–Oct19 06:59UTC window. README requires identifying later post-deadline commits.
- [!] P8.09 — DEV API 403 dev_account_mismatch persists after MLH sign-in check. No draft/post created; manual publication/checklist supplied. No public URL, submitted status or submission timestamp exists.

**Evidence:** docs/P8_DEV_ARTICLE.md; docs/P8_PUBLICATION_CHECKLIST.md; docs/ATTRIBUTION.md; docs/evidence/p8-verification.md; docs/evidence/p8/ command logs, CI/Git metadata, real live smoke and browser screenshots. **Phase status:** `[-]` prepared; publication/acceptance blocked and NOT SUBMITTED. Concrete draft has no founder publication approval yet. No new features, infrastructure spending or master changes.

## 11. S1 — Optional category expansion (never block P8)

**S1 preflight, 2026-10-16 23:39:31 UTC:** `[!]` deferred under the explicit prerequisite. P5 production email/Cron acceptance, P7 independent human labels/video and P8 verified publication remain open. About55h20m remained until the documented cutoff at this check; submission safety is not established merely by remaining time. No new integration selected, spending, account configuration, dependency change or deployment. Existing Actions evidence below is retained, not newly implemented. Assessment of all six options and exact evidence boundaries: [S1 preflight](docs/evidence/s1-preflight.md). Return to core-gate closure/P8 publication; stop stretch work.

- [ ] S1.01 — Live .tech domain through Hacktoberfest promo linked in article; DNS/HTTPS works and renewal pricing documented.
- [x] S1.02 — Existing real GitHub Actions automation (not a new stretch integration); current official Copilot category permits Actions. Run38905759266/a156994 passed; no Copilot usage claimed.
- [ ] S1.03 — Capture/share real agent sessions using Entire and reference them in write-up, if available.
- [ ] S1.04 — Replace or complement cron with *working* Temporal workflow; test crash/restart recovery, retried activity and inspection; no duplicate reminders.
- [ ] S1.05 — Run actual Gemma inference on DigitalOcean with operational evidence only if effort/budget appropriate.
- [ ] S1.06 — Use Mastra to orchestrate nontrivial useful extraction workflow if it improves actual product.

**Stop condition:** If any stretch task threatens P0–P8 quality or deadline, defer and document it as post-hackathon.

## 12. Partner prize evidence register — fill in, never invent

| Category             | Intended role                      | Real integration? | Evidence URL/path | Eligible to claim? |
| -------------------- | ---------------------------------- | ----------------- | ----------------- | ------------------ |
| Gemma | Structured document extraction | Yes — real Gemma-4-26b-a4b-it local/deployed TXT and two complete real benchmark attempts over16 frozen synthetic docs | docs/evidence/p7/run-01/, run-02/; docs/evidence/p7-benchmark-analysis.md; prior P3/P5 proof | Category supported by actual use; poor availability and agent-authored labels disclosed. Independent human review pending; organizer eligibility not guaranteed |
| Render | Web + separate scheduled Cron | Yes — fresh P8 deployed HTTPS core/Gemma/provenance passes; historical real Cron invocation | https://kai247.onrender.com; docs/evidence/p8/live-smoke.json; p5/render-release.json | Article category supported by hosting; production Cron email delivery and current dashboard SHA not verified |
| MongoDB Atlas | Persistent DB | Yes — isolated synthetic P4 planner jobs, transaction/index/reconnect | docs/evidence/p4/atlas-proof.json | Deployed owner app workflow now passes (p5/live-acceptance.json); no automatic prize eligibility claim |
| Sentry Agent Tracing | Instrumented AI pipeline | Yes — actual SDK spans + real Gemma, safe model/tokens/duration, explicitly synthetic failures visible in Sentry | docs/evidence/p6-verification.md; docs/evidence/p6/sentry-gemma.png; https://tog-africa.sentry.io/explore/traces/trace/7512242656ca4d34a78153a27ee5aa7e/ | Actual screenshot evidence public at a156994; category supported. Production trace visibility and submission acceptance not claimed |
| .tech Domain         | Public production URL              | No                | —                 | No                 |
| GitHub Copilot | Current category permits GitHub Actions automation | Yes — Actions only; Copilot itself NOT used | https://github.com/9jaDevo/KAI247/actions/runs/38905759266; docs/evidence/p8/ci-run.json | Supported via explicit Actions wording; no Copilot authorship claimed |
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

**P8 superseding audit:** historical pending-publication/Atlas/local-email rows below describe their original phases. Founder baseline + a156994 publication, P5/P8 deployed Atlas workflow and P7 actual TEST close those earlier gaps. Current blockers are DEV account mismatch, production Cron send/current dashboard proof, production Sentry visibility, independent human labels and video. No historical failure log was removed.

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

**Publication authorization:** Founder explicitly requested commit and push of the reviewed pending P8/S1 documentation/evidence and landing redesign. Included in this focused release; exact SHA is recorded by Git and the completion response. Prior uncommitted/pending-authorization notes are historical. No DEV publication, production delivery or new hosted CI/deployment success is inferred from Git push.

**Latest founder request: reference-matched public landing page.** Founder explicitly requested the attached design after S1 was deferred. Implemented landing-only scoped CSS, supplied reference artwork regions, illustrated cards, benefit icons and truthful email-status copy; semantic HTML/navigation remain functional. No partner integration or backend feature added. Evidence and responsive screenshots: docs/evidence/landing/README.md and browser-checks.json. Actual360/768/1280 browser checks show no horizontal overflow; section anchor and keyboard focus work. Initial unit run105pass/1 telemetry timeout; single-worker rerun106pass. Final command outputs in docs/evidence/landing/. Master/prompts untouched; existing P8 edits preserved. Local preview port3022; no deployment/commit/push performed. P5/P7/P8/S1 blockers below remain unchanged.

**Latest request: S1 preflight only, 2026-10-16 23:39:31 UTC — DEFERRED.** All three root docs and current evidence reviewed. Prerequisites fail: P5 deployed email/Cron acceptance, P7 human reference review/video and P8 verified submission remain open. No integration chosen; no new services, dependencies, infrastructure spend or deployment. Existing GitHub Actions proof is already recorded; no actual Copilot usage claimed. Only tracker/preflight documentation changed; existing P8 edits preserved. No app regressions rerun for this documentation-only stop. See docs/evidence/s1-preflight.md. **Next action: finish core evidence and P8 publication, not a stretch integration.** The detailed P8 handoff below remains the context for that work.

**Last phase attempted:** P8 only. Ready-to-paste official-template DEV article, exact publication checklist, P0–P7/category audit and licensing/README clarification delivered. **NOT SUBMITTED**: no DEV public URL, draft ID, published_at or contest acceptance evidence exists.
**Publication blocker:** get_my_articles returned403 dev_account_mismatch before and after connect_mlh_account reported existing complete scopes. No write attempted. Founder must repair DEV/MLH linkage or publish manually; exact steps in docs/P8_PUBLICATION_CHECKLIST.md. Concrete article also requires founder review/explicit publication authorization. Render reconnect was requested and founder replied connected, but connector remained initiated/no active account; Chrome Render tab control timed out twice. No secret UI was inspected.
**Git/release:** main HEAD a156994b951bc608b1b913d1bbe8d1adcd8b9bf0; P6/P7 pushed with earlier explicit authorization. Fresh hosted CI run38905759266 succeeds for exact SHA. P8 source/docs/evidence not committed/pushed; shared rules require founder authorization for that separate publication. Repository created2026-10-14T15:44:18Z; first commit51c5f2a author/committer2026-10-14T15:44:11Z, both within official entry window. Current history checked before cutoff; README requires listing future post-deadline work.
**Final checks:** npm test106/15, npm run test:integration42/3 (real ephemeral MongoDB; labeled model/email mocks), lint/typecheck/build pass. New smoke-script first format check failed, formatted and rerun; exact logs under docs/evidence/p8. Offline score reproduction retains both original benchmark runs. No new clean-install or fresh dependency-audit claim; hosted CI performs actual install.
**Deployed evidence:** actual HTTPS owner login/cookie flags, origin403, unauthorized401, Atlas manual create/edit/renew/history/readback, real Gemma TXT pending_review4773ms and exact evidence, no auto-renewal, explicit approval, replacement version2/manual provenance pass. Browser dashboard/detail/reload also pass using only new SYNTHETIC .invalid owner; never opted in, zero emails sent. Live Settings shows provider/Sentry configured, neither delivery nor production trace visibility inferred. Current Render deployment SHA/Cron history remains unverified despite deployed behavior showing P7 fix. Prior actual Cron had provider unavailable. Historical local P7 authorized single TEST receipt remains valid and separate.
**Evidence boundaries:** sixteen synthetic cases/two unchanged runs strict2/16 then10/16 vs regex10/16; no claimed universal win or reliable P95. References authored by implementation agent, independent human/domain-expert review pending. Video/storyboard/screenshots exist but no recording/video URL. No substantive external feedback/payment; optional first-user section omitted. No project-wide licence grant; attribution inventory supplied, founder decision pending. No .tech promo, Temporal service, Entire, DO or Mastra claim. Existing Actions explicitly qualifies for current category route; no actual Copilot use.
**Next action:** founder review, repair publication access or use manual official-template steps, publish before Oct18 23:59PDT/Oct19 07:59WAT, verify signed-out URL/tags/Week2 listing and record timestamp. No next feature phase; do not start S1. STOP at P8 preparation with publication blocked.

---
**Do not mark any item checked solely because a generated code snippet looks plausible. Run, inspect, and capture evidence.**
