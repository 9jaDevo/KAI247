# P8 final evidence and gate review

Date: 2026-10-16 UTC. **P8 only. Entry prepared, NOT published or submitted.** No product features, service purchases, original-code licence grant or master-spec amendments were made.

## P0–P7 gates audited

| Phase / gate | Current evidence | Honest remaining gap |
| --- | --- | --- |
| P0: new repo/docs/install/boot | Fresh GitHub metadata and complete observed Git history in p8/; historical actual clean install/boot logs; founder baseline and authorized releases committed | Timestamps are consistent with entry window, not independent certification of originality/personal eligibility |
| P1: accessible navigable UI | Historical 360/768/1280 browser matrix, focus/labels/error states; fresh P8 actual deployed dashboard/detail/reload/settings screenshots | No new physical-device study; current P8 settings viewport is not labeled a 360px test |
| P2 / Gate1: functional persistent data | P5 and fresh P8 actual HTTPS auth/cookie/origin checks, Atlas create/edit/renew/history/readback under isolated synthetic owner | Owner provisioning is operator-only; no public shared login or self-service signup |
| P3 / Gate2: genuine open-weight AI | Real Gemma identity, 16-fixture benchmark runs, deployed P8 real TXT candidate pending review, explicit approval and persisted renewal | Provider availability/malformed JSON, conservative date classification and amount semantics remain unreliable; earlier actual PDF failures retained; no OCR |
| P4 / Gate3: verifiable reminders | Atlas jobs/indexes/leases/recovery/retry/cancel tests; P7 real mailbox proof/explicit opt-in/one actual TEST plus founder receipt; replacement-version/cancellation screenshots | P7 actual email is a local app against separate Atlas workspace. No provider delivery webhook or exactly-once receipt guarantee. Current production Cron email send not verified |
| P5 / Gate4: public product | Live safe health, actual deployed core story and real Gemma; actual new CI run38905759266 for a156994; historical real separate UTC Cron invocation | Current Render dashboard deploy SHA/Cron run history could not be read. Last inspected Cron exited2/provider unavailable; current web Settings provider configured is not delivery proof |
| P6: observable workflow/security | Genuine Sentry ingestion + inspected model/waterfall/synthetic-failure screenshots; allowlist privacy tests and 42 integration tests; P6 source published a156994 | Production Sentry visibility not independently rechecked; live Settings says configured/visibility unverified. Last audit retained5 high development-lint advisories; no fresh security-audit claim |
| P7 / Gate5: contest proof | Two unchanged real benchmark runs, exact field counts, all failures, actual browser/Atlas/model/local email story, storyboard/screenshots, commercial hypothesis and attribution | **Independent human/domain-expert label review pending**; labels authored by implementation agent. No actual video, substantive user feedback or payment. DEV entry not published. Gate5 remains partial |

All P0–P7 checklist groups were inspected. Earlier tracker notes claiming pending Git publication/Atlas/manual CRUD/local real-email have been superseded where actual later evidence closes them. Historical reports and failures are retained; later local email is not relabeled deployed Cron delivery.

## Official rules and provenance

The current [challenge page/template](https://dev.to/challenges/hacktoberfest-week2-2026-10-12), challenge details and [official dated terms](https://dev.to/page/hacktoberfest-week2-2026-10-12-contest-rules) were inspected. Web reader could not open the rules URL; a direct HTTPS fetch returned200 and its actual entry/required-elements text was inspected. Paraphrased metadata: `p8/official-rules.txt`.

Window: **2026-10-12 19:00 UTC through 2026-10-19 06:59 UTC**, corresponding to October12 noon PDT through October18 23:59PDT; closing time October19 07:59WAT / 02:59EDT. GitHub creation2026-10-14T15:44:18Z; initial commit51c5f2af008eb247340373760b3a0f0793b550d4 author/committer2026-10-14T15:44:11Z. Latest published release a156994b951bc608b1b913d1bbe8d1adcd8b9bf0 on October16 is inside the window. Fresh metadata/history saved; no current post-deadline commit exists. README requires listing all later post-deadline changes rather than misrepresenting them as contest work.

The official template's core headings are preserved in `docs/P8_DEV_ARTICLE.md`; optional first-user section omitted. The current page explicitly permits GitHub Actions automation in the Copilot category. The draft identifies the Actions route and discloses that Copilot itself was not used. Gemma/Render/Atlas/Sentry use has actual evidence; no other category is claimed. Category inclusion is not organizer confirmation or an award guarantee.

## Commands actually executed

| Command | Result | Log |
| --- | --- | --- |
| npm run lint | Pass, exit0 | p8/lint.txt |
| npm test | Pass106 tests/15 files | p8/test.txt |
| npm run test:integration | Pass42 tests/3 files, actual ephemeral MongoDB; labeled mock model/email | p8/integration.txt |
| npm run typecheck | Pass, exit0 | p8/typecheck.txt |
| npm run build | Pass, exit0; actual Next production build | p8/build.txt |
| npm run format:check | Initial fail: new smoke-script formatting; formatted and rerun pass | p8/format.txt and format-rerun.txt |
| node scripts/report-p7.mjs docs/evidence/p7/run-01 and run-02 | Both score reproductions pass; saved fresh analyses under p8/offline-run-*.json | Historical P7 analyses restored after timestamp-only regeneration, no case/results changed |
| node scripts/verify-p8-live.mjs | Actual deployed core PASS; no real email or Cron test | p8/live-smoke.json |
| gh run view38905759266 / gh api repo / git log | Exact published SHA CI success + fresh repository/history metadata | p8/ci-run.json, repository.json, git-timestamps.txt |

No new clean npm install was run locally in P8; the actual passing hosted CI includes install. No new dependency audit or full 32-call benchmark inference was run. The deployed smoke made one real Gemma request through the live app, not a mock.

## Deployed smoke and browser

`scripts/verify-p8-live.mjs` provisions only a new labeled synthetic .invalid owner/org in the configured deployed Atlas database. Credentials remain ignored in `.local/p8-live-private.json`; no other owner's records are queried or changed. The owner stays unverified and opted out, so no reminder jobs/email are intentionally triggered.

Verified over actual HTTPS: minimal readiness200; missing session401; real owner login; Secure/HttpOnly/SameSite cookie flags; foreign-origin mutation403; manual create/edit/renew/version3/new-request read/history; real Gemma TXT `gemma-4-26b-a4b-it`,4773ms, exact matched evidence and pending_review; no automatic renewal; explicit owner confirmation; new cycle version2/dateSource manual/date2028-10-21 proves P7 provenance fix behavior is live. CLI logs out afterward. Dashboard release SHA is not exposed by health and was not inferred from it.

Actual in-app browser separately signed into that synthetic owner, displayed persisted dashboard records, opened document-derived renewal and reloaded it with correct manual provenance/history. Screenshots `p8/deployed-dashboard.png`, `deployed-renewal.png`, `deployed-settings.png`. Settings showed **Provider configured** and **Sentry configured · visibility unverified**, disabled TEST until verification/opt-in. No verification code was requested. A later preview click did not produce a confirmed preview result; subsequent observation returned login after the long idle period. No preview success or new regression/root cause is asserted from that observation. Existing one-hour session TTL is unchanged. Browser screenshots contain only labeled synthetic workspace data; the owner field uses .invalid and secret values are absent.

Initial smoke harness inspected the wrong nesting for optional settings metadata; its core assertions passed. Report retains a note rather than inventing settings booleans. The reproducible script now uses `data.organization`. Provider presence is established separately by the actual visible Settings state, not by the settings JSON shape.

A separate actual HTTPS follow-up verified the corrected settings nesting: emailOptIn false, verified false, scoped activity200 with zero jobs; it logged out afterward. Results are appended to `live-smoke.json`, without rerunning inference. The public-link check retains initial timeouts, successful GET retries and the unresolved storyboard-page HTTP timeout. A subsequent GitHub API request also timed out; local Git tree verification confirms the committed file, not current external access. No failed network probe is relabeled a successful HTTP request.

## External access and publication

- DEV get_my_articles returned403 **dev_account_mismatch**. The prescribed sign-in check returned already connected with complete requested scopes; the same read still returned403. No create/update/publish action attempted, no account-error bypass via browser. Public template/rules remain readable. Manual instructions are complete.
- Render connector reported no active connection. Founder replied connected, but subsequent status still reported initiated and later no account. No Render API operation executed without an active connection. Existing Chrome Render dashboard binding timed out twice on focus control. No restart/deploy/configuration/billing change was made. Current dashboard/Cron evidence is explicitly blocked.
- Article body ready locally; publication requires founder factual/editorial review and explicit authorization for this concrete post if access is repaired. No new P8 commit/push authorization was inferred from the earlier P6/P7 publication request.
- No DEV draft URL, canonical published URL, `published_at` timestamp, signed-out article check or Week2 acceptance/listing proof exists. **NOT SUBMITTED.**

## Deliverables and remaining founder actions

Article: `docs/P8_DEV_ARTICLE.md`. Manual exact URLs/click path/deadline/checklist: `docs/P8_PUBLICATION_CHECKLIST.md`. Attribution inventory: `docs/ATTRIBUTION.md`. README current local/deployed setup/status and root tracker/category ledger updated. Reproducible safe live-smoke script and sanitized actual evidence saved. Master/prompts remain locked.

Review and publish the article manually through the official template, or repair DEV account linkage and explicitly authorize this post. Verify signed-out URL/tags/links and the Week2 entry listing/confirmation, then record real UTC timestamp. Separately authorize P8 Git publication if desired. Production Cron send/Sentry visibility, independent human labels, optional video and substantive permitted feedback stay honestly open; do not add new partner features. Stop at P8.
