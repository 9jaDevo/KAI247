# P7 evaluation methodology

Scope: one frozen 16-document synthetic text set, the application's real Gemma path, one transparent regex comparator, no product feature expansion. Outputs belong to this working tree; no new deployment or submission is implied.

## Reproduce

```powershell
npm ci
npm test
npm run test:integration
node scripts/benchmark-p7.mjs --out docs/evidence/p7/run-02
```

The live command deliberately reads private primary `.env` for `GEMMA_API_BASE_URL`, `GEMMA_MODEL_ID`, `GEMMA_API_KEY`. It never prints the key/base path, calls an alternate model, or loads customer documents. It creates a **new** output directory and refuses overwrite. `run-01` is the original P7 measurement; subsequent runs must be identified separately and all original failures retained. Real calls may consume account quota or incur provider charges; no billing/tier change is performed. Unit tests use no provider connection.

## Fixed pipeline and labels

Dataset and references: [16-document manifest](../tests/fixtures/benchmark/p7/dataset.json), [annotation policy](../tests/fixtures/benchmark/p7/README.md). Labels were hand-authored by the implementation agent, frozen before inference and hashed in the result file. They have not been reviewed by an independent human annotator. This limits any claim of independent evidence; the results are independently inspectable, not independently collected.

Every document runs sequentially through the existing `normalizeExtractedText` → `buildExtractionPrompt` → **`extractWithGemma` / `callGemma`** → Zod output schema → `validateExtraction` functions. The real adapter performs the request and verifies the returned Gemma identity. The wrapper records attempts and sanitized synthetic responses; it does not mock or modify provider output. It retains the app's bounded retry (one retry on malformed schema/JSON, no benchmark-added retry on transport errors), 60-second request timeout, temperature 0 and 1,024 output-token cap. Raw responses are stored here only because every input is explicitly synthetic. Benchmark telemetry is disabled to avoid sending fixture text to Sentry; this does not disable the actual Gemma request.

The runner captures model/provider identity, prompt version, source hashes and dataset hash. Date-warning context is fixed at `2026-10-16` for reproducibility. Prompt boundary nonces and hosted model nondeterminism mean reruns need not be byte-identical even at temperature 0. No prompt, adapter, validation or model tuning is performed against this run's scores.

The comparator is `first-date-first-amount-v1`, implemented in `scripts/benchmark/p7-core.mjs`. It classifies document type by keywords, reads an explicit `Provider:` line, selects the first dated line anywhere, independently validates ISO/English/numeric calendar dates and DD/MM ambiguity, classifies its nearby keywords, and takes the first NGN/USD/GBP amount. It has **no AI, network, label lookup or product fallback role**. It is intentionally simple, not the best rule-based extraction system. Its failures on issue dates and decoy amounts are reported openly. This evaluation compares a validated application pipeline with that simple comparator, not raw model intelligence against an optimized competing product.

## Scores and timing

Ten fields: document type, provider, raw date, primary ISO date, date type, date status, date interpretations, source evidence, amount in minor units, currency. Exact rules/allowed-answer sets are in the annotation policy. Every field denominator is **all 16 attempted documents**, not only successful responses. Full strict correctness requires all ten fields. An inference/configuration failure gets zero field credit, so correct abstention cannot accidentally reward an unavailable provider. Separate completion and error counts expose availability.

`results.csv` contains two rows per document with per-field booleans and actual values. `results.json` retains references, structured outputs, warnings, all provider attempts/usage and timing. Outputs are checkpointed after each case, including failures. Do not average booleans into an unlabeled headline percentage that hides which fields failed.

Document latency uses a monotonic clock around the real model workflow plus deterministic validation and includes bounded retries/failures; transport attempt timing and provider usage are separate. It excludes database/UI/email, since this is a text benchmark. Median is reported for the completed attempted set, with failures included and labeled. With only 16 document observations, **P95 is withheld**; max and range describe the sample, not a production tail SLA. At least 20 observations are needed even for this runner's small-sample empirical nearest-rank P95, which still would not establish population reliability. Wall time/throughput include serial runner overhead and are not a concurrency benchmark.

Background desktop/browser/test activity and provider/network conditions are uncontrolled. This convenience sample cannot establish performance or privacy guarantees, pricing viability, legal deadline correctness, or willingness to pay. The manual browser walkthrough is a separate acceptance story and never substitutes for failed benchmark cases.

## Community input

[Building Better Agents through End-to-End Evals](https://dev.to/dailycontext/building-better-agents-through-end-to-end-evals-pgh) argues for task categories, messy synthetic data and field rubrics. Its commenters warn that final-output grading can conceal wrong trajectories and averages can hide category regressions. Accordingly, this harness retains source evidence, strict per-field counts and all failed cases; it uses deterministic grading rather than borrowing the article's unrelated performance claims. This is methodological context, not external validation of KAI247's results.
