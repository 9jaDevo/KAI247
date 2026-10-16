# P7 verification and handoff — 2026-10-16

P7 only. **Benchmark, local manual-browser workflow, real verified-owner TEST and screenshot/storyboard package executed. No finished video, independent human annotation, feedback quote, deployment, publication or submission is claimed.** The tracker retains partial P7 status for those wider evidence gates. User explicitly allowed a screenshot/storyboard fallback when recording is unavailable and deferred feedback wording.

## Executed verification

| Command/check | Actual outcome | Proof |
| --- | --- | --- |
| `npm test` | Pass: **106 tests /15 files**, including five evaluation-integrity tests | [log](p7-test.txt) |
| `npm run test:integration` | Pass: **42 tests /3 files**, real MongoDB replica set, labeled synthetic model/email transports; added document-to-replacement provenance regression assertions | [log](p7-integration.txt) |
| `npm run lint` | Pass, zero warnings | [log](p7-lint.txt) |
| `npm run typecheck` | Pass, after stopping task-owned dev server | [log](p7-typecheck.txt) |
| `npm run build` | Pass, actual Next16.4 production build | [log](p7-build.txt) |
| `npm run format:check` | Pass | [log](p7-format-check.txt) |
| `node scripts/benchmark-p7.mjs --out docs/evidence/p7/run-01` | Completed16 real document attempts; **2 candidates,14 failures**, not an accuracy pass | [command log](p7-benchmark.txt), [all results](p7/run-01/results.json), [CSV](p7/run-01/results.csv) |
| Same command, new `run-02` output | Completed full unchanged repeat, **15 candidates,1 failure**; no selective replacement | [log](p7-benchmark-repeat.txt), [all results](p7/run-02/results.json), [CSV](p7/run-02/results.csv) |
| `node scripts/report-p7.mjs` for each complete run | Pass, scores recompute exactly against frozen dataset hash | [run1](p7/run-01/REPORT.md), [run2](p7/run-02/REPORT.md) |
| Manual browser walkthrough | Pass locally: genuine import/review/edit/approval/renewal/jobs/email/renew/reload, including regression fix | [browser report](p7/browser-report.json), [scoped Atlas readbacks](p7/walkthrough-stages.json), ten screenshots |
| Actual email | One real verification message and **one real TEST** accepted. Founder confirmed TEST receipt and label | [verification](p7/email-verification.json), [receipt attestation](p7/founder-receipt.json), [activity](p7/05-real-test-activity.png) |
| Final review | Pass: diff whitespace check, credential/private-email scan, identical benchmark dataset/AI/scorer hashes, ten screenshot files, QA owner opted out with zero pending jobs | [review](p7/final-review.json) |

Tests were rerun after the provenance fix. There was no P7 clean-install claim: P6 dependencies remain installed and P7 adds no dependencies. No hosted P7 CI or new deployment was run. The app walkthrough is an actual local Next development server with a new isolated Atlas database; it is not a newly deployed HTTPS browser test. The last P6 audit reports five existing high development-lint-chain advisories, not a new P7 audit.

## Benchmark outcome

16 distinct texts ×2 complete runs =32 attempted document workflows,33 actual provider requests (one bounded retry in run2). The original run's14 errors are retained. Strict all-ten-fields: **2/16 original**, **10/16 repeat**, **10/16 baseline**. Repeat primary-date correctness14/16 vs12/16 baseline; amount14/16 for both. These facts do not establish that Gemma is uniformly better than rules.

Run1 all-attempt median674.5ms is dominated by fast errors; its successful-only median is52,962ms/n2. Repeat median6,101ms/all16 and6,091ms/15 successful candidates. **P95 withheld** for each small16-case set. [Full field table, observed failures and limitations](p7-benchmark-analysis.md) and [methodology](../P7_METHODOLOGY.md) provide exact definitions, all ten field counts, timings/usage, a weak-baseline disclaimer and seven concrete analyses. No prompt/model/AI validator was tuned between runs. A premature report invocation rejected the incomplete15-case checkpoint rather than publishing partial scores; it was rerun successfully after all16 finished.

Reference labels were written as fixed constants by the implementation agent before inference, not generated from the answers. **They are not independently human annotated/reviewed.** A domain review remains necessary to call this independent human evidence. Explicit provider labels and short synthetic templates bias this convenience set; PDF layout/OCR and production distribution are not benchmarked. Source/dataset hashes are retained.

## Browser walkthrough actually performed

1. Provisioned a new isolated P7 Atlas workspace with a private founder-controlled owner email supplied outside Git. Records/workspace/filename are explicitly synthetic. Initial sign-in returned503; direct service check and a browser retry succeeded. Root cause of that transient503 was not established; the dev log is retained.
2. Sent an actual mailbox-verification message through configured Resend, accepted by provider. The founder supplied the received code; it was used only for the intended form, never saved in repo evidence. Verified mailbox state and explicit opt-in were persisted and independently read back. No other mailbox or stranger recipient was used.
3. Uploaded `walkthrough-hosting.txt` in the browser. Actual Gemma-4-26b-a4b-it call: **24,360ms**, one attempt,952 input/195 output tokens. Exact renewal quote supports2027-10-21, while the issue date is separately classified. Candidate stayed pending until explicit checkbox/dialog approval. Title edited to `SYNTHETIC P7 · Business hosting`.
4. Browser confirmation persisted version1 and **four pending jobs**: offsets30/7/1/0 at09:00 Africa/Lagos (08:00UTC). No due date was moved to trigger delivery. The normal owner-only TEST path created a separate test job and one real transport attempt; provider accepted it at12:51UTC (08:51EDT). Founder replied “Received and clearly labeled TEST”. The app correctly remains `provider_accepted`, with no fabricated delivered webhook.
5. First synthetic renewal to2028-10-21 cancelled version1 jobs but exposed old-document provenance incorrectly remaining on the replacement date. Saved failure screenshot/readback. Corrected the existing renewal service: replacement date is manual, old current-record excerpt/filename/hash cleared, original extraction and history retained. The regression assertion passes. A second explicit synthetic cycle to2029-10-21 verifies the fix: version3/manual after reload, eight obsolete jobs cancelled, four legitimate new jobs pending. No actual purchase/payment occurred.
6. Captured activity, corrected renewal/history and360px layout. Document scroll width345≤360, manual provenance visible. Two stale “not scheduled yet” messages were corrected to actual verification/opt-in/provider/worker conditions. Browser screenshots show synthetic labels and exclude private email/settings/code.
7. Initial UI cleanup opt-out did not persist; the failed readback is retained. Existing validated `updateSettings` service then opted out **only this isolated P7 owner**, cancelled every remaining pending job, and verified12 cancelled renewal jobs plus1 provider-accepted TEST, zero pending/claimed. No extra test or scheduled email was sent. No production organization was read/modified by the walkthrough scripts.

Original extraction `6ad21d1526c1faa069995acd`; synthetic renewal `6ad21d9426c1faa069995acf`. These are synthetic-record IDs, not private owner identifiers. Historical screenshots/stages preserve the discovered failure rather than claiming the first attempt was correct.

## Deliverables and founder work

- [Frozen dataset/annotation policy](../../tests/fixtures/benchmark/p7/README.md), live runner, offline report generator and score-integrity tests.
- [2:40 demo script/shot list](../P7_DEMO_STORYBOARD.md), ten actual screenshots, commands and exact remaining capture/export/upload/review steps. **No screen recording API was available, no video recorded, no video URL invented.**
- [Commercial hypothesis/interview questions](../P7_COMMERCIAL_HYPOTHESIS.md): proposed NGN2,500/month interview experiment plus master's free-five-item hypothesis, no launched plan/payment. Founder identified an IT-provider role then deferred feedback. No substantive feedback or testimonial is present.
- [Licence, actual observed costs/unknown invoices, privacy and operational limits](../P7_COSTS_PRIVACY_LICENSE.md), verified against official model/licence/pricing/provider-term pages. Provider weight licence is separate from hosted privacy and account billing. No new service/spending was added.

P7 files: `scripts/{benchmark-p7,report-p7}.mjs`, `scripts/benchmark/p7-core.mjs`, `tests/fixtures/benchmark/p7/*`, `tests/unit/p7-benchmark.test.ts`; targeted changes in `src/components/{extraction-review,renewal-detail}.tsx`, `src/lib/renewals/service.ts`, and existing extraction integration test; P7 docs/evidence, README and root tracker. P6 uncommitted changes were preserved.

## Release boundary

Baseline main HEAD remains`cfbb19ef38814d2a25f8bc7eaca2388e2f9fdd51`; no P7 commit/push authorization, commit, deployment or published article. The existing public Render app/hosted CI evidence belongs to P5. Local real email closes the old **local** P4 gate; it does not establish deployed Cron variables, unattended reminder delivery or deployed P6/P7 fixes. Review existing previously-renewed document records after an authorized release; no historical production migration was performed.

The broader P7 gate remains partial for actual video/review and independent human annotation. Feedback is deferred, not invented. Future phase: **P8 only on explicit request**, with these limits disclosed and remaining release/provider checks addressed before complete-MVP/submission claims. Stop after P7.

Locked master SHA256 remains `30e867667519b3c9549387cabd218f33ef6803a212e9f16e1195db8b3a8cb9a0`; phase prompts `a961399b147354372a46026fa9aa0945f820e7c69bcd7f7905668fc06a0c182d`. Both match HEAD and retained docs copies. The credential scan's initial match was an existing public synthetic `.invalid` fixture email, not the real owner; private credentials/mailbox values remain absent from changed evidence/source. No secrets were staged.
