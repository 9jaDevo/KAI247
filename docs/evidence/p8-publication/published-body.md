
*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 2: Side Hustle](https://dev.to/challenges/hacktoberfest-week2-2026-10-12).*

## What I Built

A hosting invoice can contain an issue date, a payment date and a service expiry date. Put the wrong one in a calendar and the reminder can arrive perfectly on time for the wrong obligation.

KAI247 AI is a renewal workspace for Nigerian small-business owners managing hosting, insurance, licences and agreements. It turns a document into a **candidate**, shows the source passage, and asks the owner to confirm. The owner can also enter a renewal manually; the product stays useful when inference fails.

My intended first customer is the owner or IT provider keeping several business services running. A calendar is already good at alerts. The hypothesis here is that an evidence trail, one renewal history and cancellation of obsolete reminders are worth paying for when copying dates between documents becomes work. I intend to test **₦2,500 per owner/month**, with a free-five-item starting hypothesis. These are research proposals: no billing, validated willingness to pay, revenue or paying customer exists. [Commercial hypothesis and interview questions](https://github.com/9jaDevo/KAI247/blob/main/docs/P7_COMMERCIAL_HYPOTHESIS.md).

## Demo

**[Live app](https://kai247.pdev.tech)** ([Render address](https://kai247.onrender.com)) · **[Walkthrough storyboard and screenshots](https://github.com/9jaDevo/KAI247/blob/main/docs/P7_DEMO_STORYBOARD.md)**

The public landing page is open. The owner workspace requires operator-provisioned authentication; there is no public shared password or self-service registration. For an interactive synthetic workspace, follow the repository's local setup below. All illustrated business documents and renewal records are **synthetic**, not customer activity.

![Synthetic document review: compare Gemma's candidate with source evidence before approving](https://raw.githubusercontent.com/9jaDevo/KAI247/a156994b951bc608b1b913d1bbe8d1adcd8b9bf0/docs/evidence/p7/02-review.png)

The verified local walkthrough used a separate Atlas workspace: import a synthetic hosting text → real Gemma → edit/review → explicitly approve → persist a renewal and four jobs → send one authorized TEST to the verified, opted-in owner → mark renewed → reload and inspect cancelled/replacement jobs. Resend accepted that single TEST at **2026-10-16 12:51 UTC**; the founder confirmed receipt and its TEST label. The app correctly keeps **provider accepted**, because no delivery webhook is implemented.

![Actual TEST activity in the isolated synthetic walkthrough; provider acceptance is not a delivery receipt](https://raw.githubusercontent.com/9jaDevo/KAI247/a156994b951bc608b1b913d1bbe8d1adcd8b9bf0/docs/evidence/p7/05-real-test-activity.png)

On October 16, a fresh deployed HTTPS smoke test also passed login, Atlas CRUD/edit/renew/readback, real Gemma TXT extraction (**4,773 ms**), pending review, explicit approval and replacement-date provenance. This deployed check sent **no email**. The last verified scheduled Render Cron run exited with provider unavailable; production Cron email delivery is still unverified. No video was recorded: the linked 2:40 storyboard supplies screenshots and exact founder recording steps.

## Code

[Public repository](https://github.com/9jaDevo/KAI247) · [tested release a156994](https://github.com/9jaDevo/KAI247/commit/a156994b951bc608b1b913d1bbe8d1adcd8b9bf0) · [passing GitHub Actions run](https://github.com/9jaDevo/KAI247/actions/runs/38905759266)

For a local synthetic walkthrough, use Node 22.18+ or 24 LTS:

```sh
git clone https://github.com/9jaDevo/KAI247.git
cd KAI247
npm ci
npm run setup:local
npm run db:local
```

Leave MongoDB running. In a second terminal, run `npm run owner:setup`, then `npm run dev`. Read the generated ignored `.env.local` privately for the synthetic owner credentials and exact `APP_URL`. Manual CRUD works without an AI key. To exercise extraction, privately configure the three `GEMMA_*` variables documented in [P3 setup](https://github.com/9jaDevo/KAI247/blob/main/docs/P3_SETUP.md); the actual tested model is `gemma-4-26b-a4b-it` through Google AI Studio's OpenAI-compatible endpoint. The protocol name does not mean GPT is used. A `.invalid` synthetic owner cannot receive email. Real email requires a separate private owner, mailbox verification, explicit opt-in and configured Resend credentials.

## How I Built It

The core is one Next.js App Router application and a separate one-shot reminder worker. MongoDB Atlas stores owner-scoped renewals, extraction candidates, audit events and jobs. Session cookies are sealed, passwords hashed, writes validated with Zod, and every protected query is organization scoped.

```text
TXT / PDF text layer → bounded parser → real hosted Gemma
  → schema + exact-source/date checks → pending review
  → explicit owner confirmation → Atlas renewal + audit
  → deterministic timezone planner → versioned persistent jobs
  → separate Render Cron worker → Resend → recorded outcome
                    ↘ curated Sentry spans, no document text
```

AI proposes fields; it never chooses a notification time or confirms an obligation. Dates remain `YYYY-MM-DD`, amounts use minor units. Calendar arithmetic maps 30/7/1/0-day offsets to 09:00 Africa/Lagos and stores UTC instants. Unique keys, atomic leased claims, bounded retries and version cancellation reduce duplicates. They do **not** promise exactly-once email. [Atlas, web and Cron architecture/runbook](https://github.com/9jaDevo/KAI247/blob/main/docs/P5_DEPLOYMENT.md).

### What the evaluation actually showed

I froze **16 synthetic texts**, covering hosting, insurance, licensing, contracts, filing notices, missing/multiple/ambiguous dates, prompt injection and misleading amounts. Reference labels were manually authored by the implementation agent before inference; **independent human/domain-expert review remains pending**. This is an inspectable engineering check, not an independent accuracy study.

Two complete runs used the same dataset, prompt, adapter, validators and scorer. The baseline simply takes the first recognized date and currency amount. All failures count as incorrect, even for expected null fields. Strict correctness means all ten evaluated fields match the reference policy; no LLM grades another LLM.

| Measure | First real Gemma run | Full unchanged repeat | Regex/rules baseline |
| --- | --- | --- | --- |
| Documents attempted | 16 | 16 | 16 per run |
| Candidate outputs | 2 | 15 | 16 |
| Strictly correct documents | 2/16 | 10/16 | 10/16 |
| Correct date field | 2/16 | 14/16 | 12/16 |
| Correct amount field | 2/16 | 14/16 | 14/16 |
| All-attempt median latency | 674.5 ms | 6,101 ms | Not compared as inference |

The first run had three timeouts and eleven unavailable errors. Its deceptively quick median is dominated by fast failures. Successful-only medians were **52,962 ms (n=2)** and **6,091 ms (n=15)**. I withhold P95: sixteen convenience samples per run do not justify a reliable tail-latency claim. Across both runs there were 32 document attempts and 33 provider calls because one case used the existing bounded retry. Neither run was discarded or selectively rerun.

[Frozen dataset](https://github.com/9jaDevo/KAI247/blob/main/tests/fixtures/benchmark/p7/dataset.json), [reproduction methodology](https://github.com/9jaDevo/KAI247/blob/main/docs/P7_METHODOLOGY.md), and [all field counts, JSON/CSV and failure analyses](https://github.com/9jaDevo/KAI247/blob/main/docs/evidence/p7-benchmark-analysis.md) are public. Offline: `node scripts/report-p7.mjs docs/evidence/p7/run-02`. A new real run uses `node scripts/benchmark-p7.mjs --out docs/evidence/p7/run-03` and consumes provider quota.

Three failures changed how I describe the product:

1. The injection fixture retained the business date/amount but invented a provider label. Finding a quotation does not validate every surrounding field.
2. The misleading-amount case produced malformed output twice and failed schema validation. A separate paid receipt offered a next-period price that was not an agreed obligation. Numeric presence is weaker than business correctness.
3. Competing service dates made the model abstain from a primary date. The strict rubric penalizes that, even though conservative abstention can be safer. The label policy itself needs independent review.

Gemma improved the repeat's date field over this deliberately simple baseline, but **did not beat its strict document score**. I will not turn that into a general accuracy claim.

### Timeline, debugging and observability

The [official entry period](https://dev.to/page/hacktoberfest-week2-2026-10-12-contest-rules) is October 12, 2026 at noon PDT through October 18 at 11:59 PM PDT. GitHub records repository creation at **2026-10-14 15:44:18 UTC** and the [initial commit](https://github.com/9jaDevo/KAI247/commit/51c5f2af008eb247340373760b3a0f0793b550d4) at **15:44:11 UTC** that day. Those timestamps fall inside the window, although Git timestamps alone cannot certify all provenance. UI/auth/manual CRUD and extraction came first, followed by reminders, deployment, tracing and evaluation on October 14–16. Future post-deadline commits must be identified in README rather than represented as contest work.

During the walkthrough, a renewed document record incorrectly kept the previous cycle's document-confirmed provenance. The retained failure screenshot made the problem concrete. The fix marks the replacement date manual, removes obsolete current-source fields and preserves the original extraction/history. A regression assertion and deployed readback verify it. Another reminder regression was caught by integration tests before release. Two earlier deployed PDF inferences returned invalid model output; those failures remain documented.

Sentry captures real step duration, model identity and token usage when supplied. A [genuine Gemma trace](https://github.com/9jaDevo/KAI247/blob/main/docs/evidence/p6/real-traces.json) took **5.74 seconds**, with **1,007 input / 204 output tokens**; that was the slowest extraction step in this observed trace, not a fleet-wide bottleneck. A separate injected HTTP 500 is explicitly labeled synthetic. Spans use an allowlist excluding prompts, documents, private addresses and secrets. Estimated UI costs are not invoices.

![Actual Sentry Gemma span with sanitized model, duration and token evidence](https://raw.githubusercontent.com/9jaDevo/KAI247/a156994b951bc608b1b913d1bbe8d1adcd8b9bf0/docs/evidence/p6/sentry-gemma.png)

Final local verification passed **106 unit tests, 42 real-MongoDB integration tests, lint, typecheck and build**. Integration model/email transports are labeled synthetic. Hosted CI separately passed on the linked release. Those checks do not establish production deliverability or model reliability.

### Limits, costs and attribution

There is no OCR, SMS/WhatsApp, automatic purchasing, payment collection or invented statutory deadline. Hosted inference can time out or return invalid JSON. Human review is mandatory, but it is not a guarantee against a mistaken human confirmation. Five existing development-lint dependency advisories were retained at the last audit; no production-readiness certification is claimed.

The separate Render Cron has an observed minimum **US$1/month plus usage**; web/Atlas/provider invoices and complete unit economics were not audited. Model usage is recorded where returned, not inferred for failed requests. [Costs, privacy and licence boundaries](https://github.com/9jaDevo/KAI247/blob/main/docs/P7_COSTS_PRIVACY_LICENSE.md).

Project code was built with Codex assistance. Next.js, React, Tailwind, iron-session, Zod, unpdf and Sentry retain their upstream licences; the MongoDB driver uses Apache-2.0 and the JavaScript Temporal calendar polyfill uses ISC. The repository currently has **no project-wide licence grant**; public source availability should not be mistaken for permission to redistribute it. Gemma's weight licence is separate. No weights are bundled.

Community reading during the final review: [“Your Financial Agent Passed Every Eval. Can You Defend Its Decision?” by Anirudh Veeraragavan, Daily Context](https://dev.to/dailycontext/your-financial-agent-passed-every-eval-can-you-defend-its-decision-1npg) argues for traceable evidence and scrutiny of labels. That is a useful lens for the provenance defect and evaluation limitations above; it is not customer feedback or independent validation of KAI247.

## Why Does Open Innovation Matter?

Gemma is central to understanding candidate obligations across differently worded documents. Google's [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4) identifies open weights under [Apache 2.0](https://ai.google.dev/gemma/apache_2). That creates a route to evaluating another serving provider or self-hosting without rebuilding the renewal and review contracts.

That freedom is a possibility, not a result I have measured. This MVP uses hosted Google AI Studio inference; documents leave the app for that provider. I have not demonstrated private local inference, fine-tuning, lower cost or superiority to a closed model. [Hosted service terms](https://ai.google.dev/gemini-api/terms#unpaid-services) matter independently of the weight licence; the account's applicable billing tier has not been verified. Use synthetic/permitted documents until those privacy obligations are reviewed.

The useful boundary is portable extraction with inspectable failures, followed by ordinary reliable software and an accountable owner decision.

## My Agent Session

Codex assisted implementation, tests, evaluation and this draft. No public session transcript was captured. The phase tracker, commit history, test logs and retained failures provide the available development record. This article was prepared with AI assistance; the founder authorized its publication.

## Prize Categories

These are the categories supported by actual technical evidence; eligibility and awards remain the organizers' decision:

- **Best Use of Gemma** — real hosted Gemma extraction, explicit review and both complete benchmark runs, including failures.
- **Best Use of Render** — live Next.js app and a separate scheduled Cron invocation; production reminder email delivery remains unverified.
- **Best Use of MongoDB Atlas** — persisted owner-scoped records, audit history, candidates and jobs; transaction/index/reconnect tests plus deployed CRUD.
- **Best Use of Sentry Agent Tracing** — actual model/span/token screenshots and clearly labeled synthetic failure evidence.
- **Best Use of GitHub Copilot** — the current category explicitly permits GitHub Actions automation. The linked real workflow runs clean install, lint, types, unit/integration tests and build. **Copilot itself was not used; Codex was.** This claim is solely the category's Actions route.

No other partner integration is claimed. No substantive external-user feedback, customer interview result or payment has been received; the optional first-user section is intentionally omitted.
