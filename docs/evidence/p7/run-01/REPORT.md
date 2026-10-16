# P7 measured results

Run: 2026-10-16T12:39:40.393Z to 2026-10-16T12:45:04.618Z. Dataset SHA256: 66a9425f89b9cfa28da79cf87ecfb65ad83e221c40ec7926c54cba83d6012eed.
All 16 documents were attempted through the real adapter. This run is not a deployment or independent human evaluation.

| Field | Gemma pipeline correct / attempted | Simple regex correct / attempted |
| --- | --- | --- |
| documentType | 2/16 | 16/16 |
| provider | 2/16 | 16/16 |
| rawDate | 2/16 | 12/16 |
| date | 2/16 | 12/16 |
| dateType | 2/16 | 14/16 |
| dateStatus | 2/16 | 13/16 |
| interpretations | 2/16 | 12/16 |
| evidence | 2/16 | 12/16 |
| amountMinor | 2/16 | 14/16 |
| currency | 2/16 | 15/16 |

Strict all-ten-fields: Gemma 2/16; baseline 10/16.
Completed Gemma outputs: 2/16. Errors: {"AI_TIMEOUT":3,"AI_UNAVAILABLE":11}.
All-attempt median: 674.5ms; successful-output median: 52962ms (n=2). P95 withheld (n<20).
Serial wall time: 324225ms; throughput: 2.961 attempted documents/minute. Fast failures are not fast successful inference.
Reported usage only: 1836 input / 268 output tokens, 2 responses; 14 attempts lack usage. This is not a bill.

| Case | Gemma fields / 10 | Error | Milliseconds | Baseline fields / 10 |
| --- | --- | --- | --- | --- |
| 01-hosting | 10 | none | 49018 | 10 |
| 02-issue-renewal-grace | 0 | AI_TIMEOUT | 60016 | 5 |
| 03-policy | 0 | AI_TIMEOUT | 60023 | 5 |
| 04-license | 10 | none | 56906 | 10 |
| 05-contract | 0 | AI_TIMEOUT | 60010 | 10 |
| 06-filing-written | 0 | AI_UNAVAILABLE | 1076 | 10 |
| 07-filing-relative | 0 | AI_UNAVAILABLE | 750 | 5 |
| 08-no-date | 0 | AI_UNAVAILABLE | 569 | 10 |
| 09-ambiguous-ddmm | 0 | AI_UNAVAILABLE | 585 | 10 |
| 10-declared-ddmm | 0 | AI_UNAVAILABLE | 581 | 10 |
| 11-competing-services | 0 | AI_UNAVAILABLE | 558 | 9 |
| 12-prompt-injection | 0 | AI_UNAVAILABLE | 579 | 10 |
| 13-wrong-amount | 0 | AI_UNAVAILABLE | 556 | 9 |
| 14-leap-year | 0 | AI_UNAVAILABLE | 599 | 10 |
| 15-impossible-date | 0 | AI_UNAVAILABLE | 564 | 10 |
| 16-paid-not-renewal | 0 | AI_UNAVAILABLE | 31643 | 3 |

Scores recomputed against frozen labels by `node scripts/report-p7.mjs docs/evidence/p7/run-01`. See results.json/CSV for every value, synthetic response and attempt.
