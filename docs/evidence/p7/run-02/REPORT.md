# P7 measured results

Run: 2026-10-16T12:49:58.370Z to 2026-10-16T12:52:03.597Z. Dataset SHA256: 66a9425f89b9cfa28da79cf87ecfb65ad83e221c40ec7926c54cba83d6012eed.
All 16 documents were attempted through the real adapter. This run is not a deployment or independent human evaluation.

| Field | Gemma pipeline correct / attempted | Simple regex correct / attempted |
| --- | --- | --- |
| documentType | 15/16 | 16/16 |
| provider | 14/16 | 16/16 |
| rawDate | 14/16 | 12/16 |
| date | 14/16 | 12/16 |
| dateType | 14/16 | 14/16 |
| dateStatus | 12/16 | 13/16 |
| interpretations | 14/16 | 12/16 |
| evidence | 14/16 | 12/16 |
| amountMinor | 14/16 | 14/16 |
| currency | 14/16 | 15/16 |

Strict all-ten-fields: Gemma 10/16; baseline 10/16.
Completed Gemma outputs: 15/16. Errors: {"MODEL_OUTPUT_INVALID":1}.
All-attempt median: 6101ms; successful-output median: 6091ms (n=15). P95 withheld (n<20).
Serial wall time: 125227ms; throughput: 7.666 attempted documents/minute. Fast failures are not fast successful inference.
Reported usage only: 15961 input / 3563 output tokens, 17 responses; 0 attempts lack usage. This is not a bill.

| Case | Gemma fields / 10 | Error | Milliseconds | Baseline fields / 10 |
| --- | --- | --- | --- | --- |
| 01-hosting | 10 | none | 6372 | 10 |
| 02-issue-renewal-grace | 10 | none | 6091 | 5 |
| 03-policy | 10 | none | 5049 | 5 |
| 04-license | 9 | none | 11445 | 10 |
| 05-contract | 10 | none | 6476 | 10 |
| 06-filing-written | 10 | none | 3910 | 10 |
| 07-filing-relative | 10 | none | 9929 | 5 |
| 08-no-date | 10 | none | 3431 | 10 |
| 09-ambiguous-ddmm | 10 | none | 4277 | 10 |
| 10-declared-ddmm | 9 | none | 4299 | 10 |
| 11-competing-services | 4 | none | 6111 | 9 |
| 12-prompt-injection | 9 | none | 4803 | 10 |
| 13-wrong-amount | 0 | MODEL_OUTPUT_INVALID | 24681 | 9 |
| 14-leap-year | 10 | none | 6069 | 10 |
| 15-impossible-date | 10 | none | 10006 | 10 |
| 16-paid-not-renewal | 8 | none | 12121 | 3 |

Scores recomputed against frozen labels by `node scripts/report-p7.mjs docs/evidence/p7/run-02`. See results.json/CSV for every value, synthetic response and attempt.
