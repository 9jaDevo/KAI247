# P8 publication checklist — PUBLISHED

**Publication verified, superseding earlier NOT SUBMITTED notes:** Founder explicitly authorized submission on October 18. Published through signed-in Chrome as 9jadevo at **2026-10-19T03:53:29Z (October 18, 11:53:29 p.m. EDT)**, before official 2026-10-19T06:59:00Z cutoff. Public article: https://dev.to/9jadevo/kai247-a-renewal-deadline-needs-evidence-before-it-needs-ai-4h9d. DEV public API ID4875120 and unauthenticated HTTP200 confirm title, both required tags and Week2 Side Hustle Submission banner. AI disclosure fully_autonomous; no human editorial contribution invented. Exact body and screenshot in docs/evidence/p8-publication/. Connector still returns dev_account_mismatch; normal authenticated browser publication succeeded. No separate organizer eligibility/judging certification or dedicated entry-list visibility is claimed. Existing production Cron, independent labels and video limitations remain disclosed. No new features or tests rerun for publication-only changes. These tracker/evidence updates are not committed. STOP.

Historical preparation below (2026-10-16): No DEV draft or published post was created by this phase. Submission URL, submission timestamp and organizer acceptance are **unknown / unverified**.

## Exact entry and deadline

- [Week 2 challenge, official template button and categories](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).
- [Official dated contest rules](https://dev.to/page/hacktoberfest-week2-2026-10-12-contest-rules).
- Opens October 12, 2026 at 12:00 PDT; closes **October 18 at 23:59 PDT = October 19 at 06:59 UTC / 07:59 WAT / 02:59 EDT**. Publish early. A public landing badge saying ended is not reliable evidence of form acceptance; the signed-in publishing path still needs founder verification.
- [Complete article](P8_DEV_ARTICLE.md), matching the current template's headings and `devchallenge`, `hf26challenge` tags. Optional first-user section omitted because no substantive feedback exists.
- Repository creation **2026-10-14T15:44:18Z**; initial author/committer time **2026-10-14T15:44:11Z** at `51c5f2af008eb247340373760b3a0f0793b550d4`. [Fresh GitHub metadata](evidence/p8/repository.json), [all current commit timestamps](evidence/p8/git-timestamps.txt), [rules check](evidence/p8/official-rules.txt). Current HEAD `a156994b951bc608b1b913d1bbe8d1adcd8b9bf0` is within the window. This establishes timestamp consistency, not a comprehensive provenance or personal-eligibility certification.

## Verified links and evidence boundaries

| Item | URL / artifact | Status |
| --- | --- | --- |
| Public app | https://kai247.onrender.com | Live HTTPS; fresh P8 actual auth/Atlas/CRUD/Gemma/approval/renew readback pass |
| Safe readiness | https://kai247.onrender.com/api/health | 200; minimal ready flag, not a provider-health claim |
| Source | https://github.com/9jaDevo/KAI247 | Public; latest tested release a156994 |
| CI | https://github.com/9jaDevo/KAI247/actions/runs/38905759266 | Completed success for exact a156994; job details saved in evidence/p8/ci-run.json |
| Gemma proof | https://github.com/9jaDevo/KAI247/blob/main/docs/evidence/p7-benchmark-analysis.md | Real 16-case runs and every failure; reference labels agent-authored, independent human review pending |
| Atlas architecture | https://github.com/9jaDevo/KAI247/blob/main/docs/P5_DEPLOYMENT.md | Persisted records/audit/jobs, scoped IDs, indexes/transactions; no disk persistence dependency |
| Sentry screenshots | https://github.com/9jaDevo/KAI247/blob/main/docs/evidence/p6/sentry-gemma.png | Genuine project trace inspected in P6; production visibility not independently rechecked in P8 |
| Sentry trace | https://tog-africa.sentry.io/explore/traces/trace/7512242656ca4d34a78153a27ee5aa7e/ | Requires project membership; public sanitized screenshot is the judge-accessible proof |
| Walkthrough | https://github.com/9jaDevo/KAI247/blob/main/docs/P7_DEMO_STORYBOARD.md | Real screenshots + local real-email receipt attestation; **no video** |
| Render dashboard | https://dashboard.render.com/web/srv-db8qvg6q1p3s73931peg | P8 connector never became active after founder replied connected; Chrome control timed out. Current deploy SHA and Cron run history not independently read in dashboard |
| Cron dashboard | https://dashboard.render.com/cron/crn-db8raion74is73chvv40 | Historical configured/actual invocation proof exists; current EMAIL configuration and real scheduled send remain unverified |
| Custom .tech domain | None included in article | No Hacktoberfest promo ownership/provenance proof; no domain prize claimed |
| DEV entry | None | API 403 dev_account_mismatch, including after sign-in check; **not published/submitted** |

Public links and embedded screenshot URLs are checked in `evidence/p8/public-links.json`. P8 screenshots are local until separately authorized Git publication. Article embeds already-published sanitized P6/P7 assets pinned to a156994, so it does not depend on unpublished P8 images.

The bulk public link check retained four initial timeouts; three succeeded on a GET retry. The storyboard page and subsequent GitHub API lookup timed out. Its committed path is verified locally with `git ls-tree HEAD`, but current external HTTP access remains unverified (`evidence/p8/storyboard-link.json`). Inspect its rendered page during final publication preview; do not label the failed network probes passes.

## Partner categories to retain in the article

Official current wording is on the challenge page. Meaningful-use evidence supports Gemma, Render, MongoDB Atlas, Sentry Agent Tracing and the **GitHub Actions route** of Best Use of GitHub Copilot. No actual Copilot usage is claimed. Render reminder delivery remains explicitly limited. No .tech, Temporal service, Entire, DigitalOcean, Mastra, TabPFN, Tinker, Arduino, Backboard, ElevenLabs, SerpApi or Tiger Data integration is claimed. `@js-temporal/polyfill` is date arithmetic, not the Temporal durable-workflow service. No category eligibility or award is guaranteed.

## Founder publication steps

1. Review [the complete article](P8_DEV_ARTICLE.md), benchmark limitations and [gate audit](evidence/p8-verification.md). Correct personal statements, team attribution and factual details. Confirm your age/jurisdiction/employer/other eligibility against official terms; engineering cannot attest them for you.
2. Decide whether to grant a project-wide code licence. None currently exists; the draft accurately says that. Do not describe the app code as permissively licensed merely because Gemma/dependencies are. This is a disclosure, not an asserted rules disqualification.
3. Sign into **your intended DEV account** at https://dev.to. If using DevRelay, repair the MLH→DEV account link/write access; do not repeatedly retry create while it returns dev_account_mismatch. No existing draft could be inspected through the denied account. Check your DEV dashboard manually to avoid creating a duplicate entry.
4. Open the Week 2 challenge above and click **Submission Template**. It opens DEV's new-post editor with the official prefill. Use the title, body and exact two tags from `P8_DEV_ARTICLE.md`; do not paste its YAML fence into the visual rich-text body. In the basic Markdown editor, the YAML is valid frontmatter; remove `published: false` only when deliberately publishing.
5. Preview the article. Check all screenshots, tables, links and synthetic labels. Keep the current truthful limitations. The live workspace is guarded: use its local setup instructions or privately arrange an isolated judge owner; do not publish real-owner credentials. No recording is required to invent a demo: the rules permit a deployed link **or** video. A real recording would improve evidence if time permits; use the existing storyboard.
6. Declare AI assistance in DEV's disclosure control (**some_ai** after founder editorial contribution; **fully_autonomous** if an agent writes and publishes without human edits). The draft already discloses Codex assistance in its body. Do not select no_ai for this agent-written draft.
7. Review the Prize Categories section against actual evidence and current terms. The categories are identified in the post; do not claim additional integrations by selecting names. Confirm any required terms/eligibility personally.
8. **Publish before the cutoff.** Publication has not been authorized for this concrete draft and the connector is blocked. If asking the agent to publish, first repair access and explicitly authorize this reviewed post; otherwise publish yourself from DEV.
9. Open the final article signed out. Verify title, required tags, public images, app/source/CI links, and the Week 2 entry listing/confirmation. Record the canonical public URL, DEV `published_at` UTC timestamp and challenge-listing/acceptance evidence in the root tracker. An editor URL or a draft is not submission proof. If the listing is delayed or absent, report that separately rather than asserting acceptance.
10. If any commits occur after **2026-10-19T06:59:00Z**, identify their hashes/timestamps and changes in README as post-deadline work. Do not backdate commits or rewrite the entry narrative to imply they existed at cutoff.

## Remaining operational checks (do not delay an honest entry indefinitely)

- Render: privately confirm web and Cron deploy SHA, both environment sets and most recent scheduled invocation. Do not screenshot secret values. Web Settings currently shows email/Sentry configured; configuration alone proves neither delivery nor visible production traces.
- Use only the authenticated founder's verified opted-in mailbox for a separately authorized deployed TEST. P7's real local TEST already has receipt attestation, but does not prove production Cron delivery. Do not alter due dates to cause a send.
- Complete independent human/domain-expert reference review and, if feasible, record/review/upload the real video. No customer quote/payment may be added without permitted actual wording.
- P8 source/docs/evidence have not been committed or pushed. Shared rules require founder authorization for that separate publication. No new features or services were added.
