# P7 benchmark: results and failure analysis

**16 distinct synthetic documents, two complete real runs, 32 document attempts, 33 provider requests.** Same dataset, references, prompt, adapter, model and scoring hashes in both runs. No output-driven prompt/model/validator tuning. The second full repeat was started after a separate browser upload succeeded following first-run availability failures; it is not a replacement for run 1. Both are retained, with no third run or selective case retry beyond the app's one bounded malformed-output retry.

| Observation | Original run 1 | Full repeat run 2 | Simple regex (same both runs) |
| --- | --- | --- | --- |
| Completed structured candidates | 2/16 | 15/16 | 16/16 |
| All ten fields strictly correct | 2/16 (12.5%) | 10/16 (62.5%) | 10/16 (62.5%) |
| Primary date correct, including required null | 2/16 | 14/16 | 12/16 |
| Date type correct | 2/16 | 14/16 | 14/16 |
| Exact source-evidence criterion | 2/16 | 14/16 | 12/16 |
| Amount in minor units correct | 2/16 | 14/16 | 14/16 |
| Errors | 3 timeouts; 11 unavailable | 1 malformed-output failure after 2 attempts | No network dependency |
| Median document time, all attempts | 674.5ms | 6,101ms | Local regex timing in raw records |
| Median time, successful candidates only | 52,962ms (n=2) | 6,091ms (n=15) | Not inference |
| Range, all attempts | 556–60,023ms | 3,431–24,681ms | See raw records |
| Serial elapsed / throughput | 324,225ms / 2.961 attempts per minute | 125,227ms / 7.666 attempts per minute | Not a load test |

Every field denominator includes all 16 attempted cases. Failed inference does not get free credit for null labels. Run 1's subsecond median mostly describes fast errors, **not** fast useful inference. P95 is withheld for each 16-case convenience sample; pooling different conditions to create a more impressive tail number would be misleading. These are measured workflow times including the app's bounded retry and deterministic validation, not database/UI/email latency.

All ten field counts and case-level values: [run 1 report](p7/run-01/REPORT.md), [run 2 report](p7/run-02/REPORT.md), their `results.json`/`results.csv` and `analysis.json`. [Methodology](../P7_METHODOLOGY.md) explains label provenance, exact grading, baseline limitations, fixed date context and reproducibility commands. References are implementation-agent-authored and not independently human annotated; founder/domain-expert review remains pending.

## What these results support

This run does **not** establish that Gemma is more accurate overall than rules. The full repeat tied the simple baseline's strict document count, improved several date/evidence fields and regressed on some uncertainty/provider/amount judgments. Original-run availability was poor. Two repeat successes do not erase the first run's fourteen failures. The baseline is intentionally simple and benefits from explicit `Provider:` lines; it is not a competitive optimized parser.

Run 1 returned 1,836 input / 268 output tokens from two responses. Run 2 returned 15,961 input / 3,563 output tokens over 17 responses, including two answers rejected as malformed. Fourteen original-run failed attempts returned no usage; reported totals are not a complete consumption or billing measurement. Google AI Studio/hosted model and network conditions are uncontrolled. Provider infrastructure logs were not available, so root cause of the first-run transport failures is **not established**.

## Specific failure analyses

1. **Availability — `02-issue-renewal-grace` and `03-policy`, run 1.** Both hit the 60s app timeout (60,016 / 60,023ms), so no candidate semantics could be scored. The identical full-repeat cases passed all ten fields at 6,091 / 5,049ms. This is observed variability, not proof that a model change solved anything. Keep visible retry/error UX and no silent baseline-as-AI fallback. No extra transport retry was added to improve scores.

2. **Overcautious status — `04-license` and `10-declared-ddmm`, repeat.** The date itself is correct (`2027-11-24` / `2027-04-03`), but Gemma marks uncertainty, so the app conservatively retains `ambiguous`. References expected `supported`: one date has day 24, and the other explicitly states DD/MM. Each scores 9/10. This is friction/false uncertainty rather than an invented deadline; human review remains possible. Do not silently relabel results to score them as supported.

3. **Competing services — `11-competing-services`, repeat, 4/10.** Gemma leaves primary date missing while supplying competing domain/hosting dates as alternatives. The fixed rubric expected either primary date with an ambiguous status; primary raw/date/type/status/interpretations/evidence therefore lose credit. This is conservative abstention and a rubric-design limitation, not evidence that an unsupported due date was saved. A domain reviewer may prefer null-primary-plus-alternatives, but changing labels after seeing this answer would invalidate this comparison. Keep the original labels and record the disagreement for a future version.

4. **Metadata hallucination under adversarial text — `12-prompt-injection`, repeat, 9/10.** Correct business date and amount survive and the app flags instruction-like text. Provider is incorrectly `text_content_of_the_document` rather than Fictional Safe Cloud. The provider verification flag is false; a human must correct it. This fixture does not show successful resistance to every injection, and numeric/date evidence checks alone do not establish semantic correctness of all fields.

5. **Malformed output on amount distractors — `13-wrong-amount`, repeat, 0/10.** Two real responses (10,739 / 13,940ms) both end with an unmatched Markdown fence after JSON and include garbled date/other-date fields. The adapter's schema/JSON gate rejects them with `MODEL_OUTPUT_INVALID`; 24,681ms total, no candidate. Both full synthetic responses are retained. No wrong amount is persisted, but this is a real usability failure. Stripping more text or tuning the prompt against this case was deliberately not done during evaluation.

6. **Correct numeric evidence, wrong business amount — `16-paid-not-renewal`, repeat, 8/10.** Date correctly abstains, but historical NGN 30,000 is offered as an amount even though the document says no renewal price is agreed. The current validator establishes that a number is written, not that it belongs to the next renewal. Reference amount/currency are null. This is why the UI still needs source-context review; “in document” does not mean commercially correct.

7. **Baseline weaknesses (not Gemma faults).** `02-issue-renewal-grace` selects the issue date, `07-filing-relative` selects the printed issue date instead of abstaining rather than calculating a statutory date, and `13-wrong-amount` takes the prior-year NGN 99,000 rather than the current total. Exact case values remain in CSV. These are limitations of the declared simple comparator, not proof that every rules system would fail.

## Separate product walkthrough finding

A real document-imported renewal initially carried its old `document_confirmed` provenance after the owner entered a replacement date. [Failure screenshot](p7/failure-provenance-before-fix.png) and `walkthrough-stages.json` preserve the original version-2 observation. The localized fix marks subsequent owner-entered replacement dates manual and clears the old current-record evidence fields, keeping original evidence in Extraction/history. A real second synthetic cycle and regression assertions verify the fix. No historical production records were migrated. Deployment and review of previously renewed document records remain a release gate.

No benchmark scores were changed by that renewal-service/UI fix: the evaluated AI files and scorer hashes remain identical between runs. The manual walkthrough is separate from benchmark accuracy and includes one actual authorized TEST email, provider acceptance and founder-reported receipt. It does not establish Render Cron email delivery, an automated delivery webhook, customer payment or a recorded video.
