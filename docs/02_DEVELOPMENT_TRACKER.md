# KAI247 AI — Development Tracker & Evidence Log

**Tracker version:** 1.0 | **Created:** 2026-10-14 | **Overall:** NOT STARTED  
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
| **P0**           | Oct 14                 | Project kickoff, brand-new repository, workspace, specs, environment inventory | Fresh repo + docs committed + project boots             | `[ ]`  |
| **P1**           | Oct 14                 | Premium UI and navigation, static demo states                                  | Responsive navigable pages + screenshots                | `[ ]`  |
| **P2**           | Oct 14–15              | Auth, Atlas, manual renewal CRUD                                               | Real persistent end-to-end CRUD under owner auth        | `[ ]`  |
| **P3**           | Oct 15                 | Gemma document extraction and human approval                                   | Real Gemma extraction → evidence → approved record      | `[ ]`  |
| **P4**           | Oct 16                 | Email reminder engine and reliability                                          | Test email + persisted job + cancel/retry tests         | `[ ]`  |
| **P5**           | Oct 16                 | Render deployment and CI                                                       | Public working URL + passing workflow + cron configured | `[ ]`  |
| **P6**           | Oct 17                 | Sentry traces and safety/quality hardening                                     | Sanitized traces + test evidence + errors handled       | `[ ]`  |
| **P7**           | Oct 17–18              | Evaluation, real-user test, product demo                                       | Reproducible benchmark + demo + evidence log            | `[ ]`  |
| **P8**           | Oct 18                 | DEV submission and prize proof                                                 | Article published and entry verified                    | `[ ]`  |
| **S1 (stretch)** | Only after P0–P8 gates | .tech, GitHub Actions/Copilot evidence, Temporal, Entire, DO/Mastra            | Every claimed partner demonstrated                      | `[ ]`  |

**Hard cutoff:** Submit **before** Sunday Oct 18, 23:59 PDT / Monday Oct 19, 07:59 WAT. Due-date note: contest landing page may show “Live Ended” conflicting with official dated rules; founder must verify form availability earlier, not at final minute.

## 2. P0 — Kickoff, source control, and environment

**Dependencies:** Founder confirms fresh Week 2 repo and authorizes creation/connection of accounts.  
**Exit gate:** Working Next.js app boots locally, source-of-truth docs committed to **new** GitHub repo, no secrets exposed.

- [ ] P0.01 — Confirm brand-new repo was created within contest entry period; record URL and creation timestamp: `TBD`.
- [ ] P0.02 — Place all 3 management Markdown files at repository root unchanged; add README links to them.
- [ ] P0.03 — Initialize Next.js + TypeScript + Tailwind + lint + formatter; lock dependency versions.
- [ ] P0.04 — Create folders, `.gitignore`, `.env.example`, consistent scripts (`dev`, `build`, `lint`, `typecheck`, `test`).
- [ ] P0.05 — Design and document required environment variables; secret values never in git.
- [ ] P0.06 — Run clean install/build/lint/typecheck, record outputs.
- [ ] P0.07 — Commit and push only after confirming ownership/permissions; save commit SHA.

**Evidence:** repo URL: `TBD` | initial commit SHA: `TBD` | local boot screenshot/log: `TBD`.  
**Known blockers:** `TBD`. **Phase status:** `[ ]`.

## 3. P1 — Product UI and UX skeleton

**Exit gate:** All routes and critical empty/loading/error states accessible, responsive and not pretending mock values are real data.

- [ ] P1.01 — Define UI tokens, components (layout/sidebar/topbar/buttons/cards/forms/status badges/dialogs).
- [ ] P1.02 — Build clear landing page and demo call-to-action without fabricated testimonials.
- [ ] P1.03 — Build login screen and authenticated shell placeholders (real auth arrives P2).
- [ ] P1.04 — Build dashboard, renewal list, manual form/details, import/review, activity, settings.
- [ ] P1.05 — Realistic **labeled synthetic** fixtures, loading/empty/AI-unavailable/error states.
- [ ] P1.06 — Mobile 360px / tablet 768px / desktop 1280px tests; keyboard tab order and labels.
- [ ] P1.07 — Screenshots at mobile/desktop; run lint/typecheck/build.

**Evidence:** screenshot paths: `TBD` | tests: `TBD`. **Phase status:** `[ ]`.

## 4. P2 — Owner authentication, Atlas and renewal CRUD

**Exit gate:** Authenticated owner creates, edits and renews records; reload shows persisted data from Atlas; unauthorized requests fail.

- [ ] P2.01 — Implement server-side owner authentication, hashed passwords, secure sessions and session expiry.
- [ ] P2.02 — Connect real MongoDB Atlas; pooled connection, collections and indexes.
- [ ] P2.03 — Implement `User`, `Organization`, `Renewal`, `AuditEvent`, `Extraction`, `ReminderJob` schemas/types.
- [ ] P2.04 — CRUD APIs with Zod input validation, due-date parsing, organization scoping.
- [ ] P2.05 — Connect dashboard/list/form/detail UI to real API data; correct overdue/due-soon calculations.
- [ ] P2.06 — Implement archive and `renewed` action with version updates; audit events.
- [ ] P2.07 — Integration tests for create/update/read, forbidden other-owner access, invalid date, incorrect amounts, input injection.
- [ ] P2.08 — Seed only synthetic demo records, clearly tagged; no live fake metrics.

**Evidence:** DB verified: `TBD` | tests: `TBD` | commit: `TBD`. **Phase status:** `[ ]`.

## 5. P3 — Real Gemma document extraction + human review

**Exit gate:** A machine-readable hosting invoice is parsed, actually submitted to Gemma, reviewed with exact source text, manually confirmed, and saved; malformed/ambiguous sources do not create records.

- [ ] P3.01 — Build upload validation (TXT/PDF 5 MB, magic/type checks, auth, timeout, rate limit).
- [ ] P3.02 — Text extraction from TXT / PDF text layer; scanned-only docs receive clear unsupported message.
- [ ] P3.03 — Gemma adapter with env-based endpoint/model credentials; verify real model ID and usage; no hidden closed-model replacement.
- [ ] P3.04 — Structured extraction with Zod validation and exact verifiable evidence snippets.
- [ ] P3.05 — Robust ambiguous/multiple date rules; date type classification, `DD/MM/YYYY` handling, missing date state.
- [ ] P3.06 — Extraction review UI with editable candidate and mandatory confirmation.
- [ ] P3.07 — Confirm endpoint creates Renewal; unapproved candidate creates none.
- [ ] P3.08 — Prompt-injection fixtures, wrong-date and no-date tests; log failures.
- [ ] P3.09 — Record exact Gemma model + provider and one real trace/log of execution (sanitized).

**Evidence:** AI proof model/provider: `TBD` | sample fixture: `TBD` | extraction output/screenshot: `TBD`. **Phase status:** `[ ]`.

## 6. P4 — Email reminders and durable scheduling

**Exit gate:** Approved renewal creates scheduled jobs, authorized user receives a real test email, retry/cancel/idempotency logic is tested.

- [ ] P4.01 — User settings: timezone, verified email, explicit opt-in, reminder offsets.
- [ ] P4.02 — Deterministic reminder planner with date-only due date + local 09:00 + UTC scheduling.
- [ ] P4.03 — Store jobs persistently in Atlas with unique idempotency key and lease/claim status.
- [ ] P4.04 — Separate scheduler command, independent of Next.js web process; support due jobs and safe retries.
- [ ] P4.05 — Configure real transactional email provider and authorized sender/recipient.
- [ ] P4.06 — Send controlled real TEST email to verified owner only; capture provider-accepted status; do not mislabel as delivered.
- [ ] P4.07 — Notification history screen and redacted provider errors.
- [ ] P4.08 — Tests: duplicate job suppression, provider transient failure, restart simulation, cancelled renewed item, overdue created today, timezone rollover.

**Evidence:** sanitized received-email screenshot: `TBD` | delivery log: `TBD` | failure test: `TBD`. **Phase status:** `[ ]`.

## 7. P5 — Render deployment and continuous integration

**Exit gate:** Public Render URL operates against Atlas/real Gemma and reminder processor configured; green CI.

- [ ] P5.01 — Configure GitHub Actions lint/typecheck/test/build on push/PR.
- [ ] P5.02 — Deploy web app on Render; configure secrets in dashboard, not git; select reasonable tier.
- [ ] P5.03 — Configure separate Render Cron service with UTC schedule, persistent DB and clear job logs; document likely minimum charge and confirm founder approval before spending.
- [ ] P5.04 — Configure HTTPS, auth session secrets, verified callback/base URLs and health endpoint.
- [ ] P5.05 — Deploy smoke test end-to-end: login, manual renewal, Gemma extraction, confirm, email test.
- [ ] P5.06 — Verify no reliance on ephemeral local file persistence; screenshot Render services and live app.

**Evidence:** live URL: `TBD` | Render dashboard screenshot: `TBD` | GitHub Action run URL: `TBD`. **Phase status:** `[ ]`.

## 8. P6 — Sentry, resilience and safeguards

**Exit gate:** Real sanitized AI traces visible; failures handled clearly; core security tests pass.

- [ ] P6.01 — Sentry installed/configured for server errors and AI step spans.
- [ ] P6.02 — Trace `parse_document`, `gemma_extract`, `validate_candidate`, `confirm_record`, `queue_reminder`, `send_email`; exclude PII/document text.
- [ ] P6.03 — Instrument real latency, input/output token counts if provided, error flags, timeout & retry.
- [ ] P6.04 — Capture actual Sentry screenshot and discuss at least one finding (if genuine).
- [ ] P6.05 — Test authorization, upload rejection, rate limiting, log sanitization, safe model prompt handling.
- [ ] P6.06 — Accessibility checks and mobile UI fixes.
- [ ] P6.07 — Correct defects discovered without unrelated feature creep.

**Evidence:** Sentry trace screenshot: `TBD` | security tests: `TBD` | fixed issue: `TBD`. **Phase status:** `[ ]`.

## 9. P7 — Evaluation, field validation and demo

**Exit gate:** Benchmark reproducible, real observations recorded, credible video/demo recorded and reviewed.

- [ ] P7.01 — Prepare 12–20 labeled synthetic/permitted documents across hosting, vehicle, license, contract and ambiguous/missing-date classes.
- [ ] P7.02 — Compare actual Gemma outputs with simple deterministic regex baseline; report per-field counts and errors; do not make up numbers.
- [ ] P7.03 — Measure inference median/P95 and invalid/uncertain outcomes using actual timestamps; publish methodology.
- [ ] P7.04 — Get feedback from at least one consenting Nigerian business owner, accountant or IT provider if available; record actual quote or anonymized summary with permission. **Not required to fabricate for phase completion.**
- [ ] P7.05 — Capture demo video: new/imported document, evidence-backed extraction, editing, approval, dashboard, email, activity trace.
- [ ] P7.06 — Confirm test mode clearly labeled and all publicly advertised features genuinely work.
- [ ] P7.07 — Record privacy, limitations, costs, and model licensing notes.

**Evidence:** benchmark results path: `TBD` | demo link: `TBD` | user feedback: `Not yet collected`. **Phase status:** `[ ]`.

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
| Gemma                | Structured document extraction     | No                | —                 | No                 |
| Render               | Hosted web app + cron              | No                | —                 | No                 |
| MongoDB Atlas        | Persistent app DB                  | No                | —                 | No                 |
| Sentry Agent Tracing | Instrumented AI pipeline           | No                | —                 | No                 |
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
| Lint                       | TBD        | Not run       | —            |
| Typecheck                  | TBD        | Not run       | —            |
| Unit tests                 | TBD        | Not run       | —            |
| Integration tests          | TBD        | Not run       | —            |
| Build                      | TBD        | Not run       | —            |
| Gemma extraction real call | TBD        | Not run       | —            |
| Baseline benchmark         | TBD        | Not run       | —            |
| Reminder email delivery    | TBD        | Not run       | —            |
| Cron/restart test          | TBD        | Not run       | —            |
| Unauthorized access test   | TBD        | Not run       | —            |
| 360px responsiveness       | TBD        | Not run       | —            |
| Live Render smoke test     | TBD        | Not run       | —            |
| Sentry trace               | TBD        | Not run       | —            |
| Demo video                 | TBD        | Not recorded  | —            |
| DEV published entry        | TBD        | Not published | —            |

## 14. Blocker and decision log

| Date/Time WAT | Phase | Blocker / decision                                   | Owner   | Workaround / action                            | State |
| ------------- | ----- | ---------------------------------------------------- | ------- | ---------------------------------------------- | ----- |
| 2026-10-14    | P0    | Credentials/account provisioning pending until setup | Founder | Supply secrets securely as each phase requires | Open  |

## 15. Latest Codex handoff (replace after each phase)

**Last phase attempted:** None.  
**Current branch / commit:** TBD.  
**Completed since last handoff:** None.  
**Tests actually run:** None.  
**Known broken features:** Not assessed.  
**Pending founder inputs:** Fresh GitHub repo, environment secrets when needed.  
**Next prompt to paste:** Phase P0 from `03_CODEX_PHASE_PROMPTS.md`.

---
**Do not mark any item checked solely because a generated code snippet looks plausible. Run, inspect, and capture evidence.**
