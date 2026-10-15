# P3 verification and handoff

Verified locally on **2026-10-14** (UTC times below). P3 only. The founder
explicitly requested P3 while the P2 Atlas gate is still blocked. That request
is recorded as an exception, in the same way P1 was authorised with P0 pending.
All runs used the local MongoDB 8.2.6 replica set, **not Atlas**. Every uploaded
document was synthetic (`tests/fixtures/documents/`).

## Model and provider proof

- **Model:** `gemma-4-26b-a4b-it` (Gemma 4, open weights, Apache 2.0), served by
  Google AI Studio's OpenAI-compatible endpoint
  `generativelanguage.googleapis.com/v1beta/openai`. Inference is hosted, not
  local.
- **Identity:** The endpoint's `GET /models` listed `models/gemma-4-26b-a4b-it`
  and `models/gemma-4-31b-it`. Every completion's `model` field read
  `gemma-4-26b-a4b-it`, and the adapter refuses any other reported model (unit
  and integration tested). No Gemini, GPT or other closed model is reachable
  from this path: the configured model ID must match `gemma-*`.
- **Sanitized real outputs:** `p3/gemma-live-proof.json` contains Gemma's raw
  JSON per synthetic document, the validated candidate, the provider-reported
  model ID, measured latency and token usage. The API key and prompts are not
  included.

## Real Gemma inference: `npm run ai:proof`

| Run (UTC) | Calls | Invalid answers | Latency min / median / max | Labels matched | Evidence |
| --- | --- | --- | --- | --- | --- |
| 1 · 19:24, before retry existed | 6 | 1 (TXT invoice, malformed JSON) | 4,170 / 4,624 / 8,849 ms (5 valid) | 5/7 | `p3/gemma-live-proof-run1-before-retry.json`, `p3-gemma-live-run1-before-retry.txt` |
| 2 · 19:38, final | 6 | 0 | 3,157 / 4,823 / 9,360 ms | 6/7 | `p3/gemma-live-proof.json`, `p3-gemma-live.txt` |

Final-run detail. Latency is measured wall-clock time from this Lagos-region
machine to Google:

| Fixture | Result | ms | Tokens in/out | Label |
| --- | --- | --- | --- | --- |
| hosting-invoice-two-dates.txt | renewal 2027-10-21, **needs decision** (service-period end 20 Oct 2027 also listed as expiry) | 9,360 | 1021/357 | mismatch: expected `supported` |
| hosting-invoice-two-dates.pdf | renewal 2027-10-21 supported, evidence page 2 | 7,109 | 1052/296 | match |
| insurance-certificate.txt | expiry 2027-10-31 supported | 5,075 | 1007/204 | match |
| no-date-letter.txt | missing; "within 30 days" not converted to a date | 3,157 | 936/110 | match |
| ambiguous-date.txt | ambiguous; both readings, no ISO | 3,999 | 940/150 | match |
| malicious-prompt.txt | real expiry 2027-03-15; injected 2030-01-01 rejected; injection warning | 4,570 | 993/168 | match |
| scanned-no-text.pdf | `NO_TEXT_LAYER` before any model call | — | — | match |

The labels were written before any model run and **were not edited afterwards**.
The single mismatch is conservative behaviour: the invoice really does contain
both "Service period … to 20 October 2027" and "renews on 21 October 2027", and
the validator refuses to choose silently between them (master spec §F rule 2).
This is a tiny smoke sample, not the P7 benchmark.

## Browser acceptance with real Gemma: `scripts/verify-p3.mjs`

Uses headless system Chrome driven by an existing local playwright-core 1.57
(`KAI247_PLAYWRIGHT_MODULE`), the local dev app on `127.0.0.1:3000`, the
synthetic owner, and **no mocks**. Four runs were made. Every one is kept:

| Run (UTC) | Outcome | What happened | Evidence |
| --- | --- | --- | --- |
| 1 · 19:43 | **pass** | Full story. The PDF invoice upload-to-review took 24.4 s, including first-time dev compilation; model time was 7.4 s | `p3-browser-run1.txt`, `p3/browser-report-run1.json` |
| 2 · 19:57 | **fail (safe)** | Gemma quoted the evidence exactly but wrote the date as `"21 October <li>er 2027"`. The validator discarded it (`unsupported`), so the form had no date and the script stopped. A fix was then added (see error analysis 3) | `p3-browser-run2-garbled-date-failure.txt`, `p3/browser-report-run2-garbled-date-failure.json`, `p3/failure-run2-garbled-date.png` |
| 3 · 20:00 | **fail (safe)** | Both attempts degenerated until `max_tokens`. After 45 s the UI showed *"Gemma's answer was cut off before it finished. Nothing was saved; retry."* Nothing was persisted | `p3-browser-run3-model-truncation-failure.txt`, `p3/failure-run3-model-truncation.png` |
| 4 · 20:06 | **pass (final)** | Full story below | `p3-browser.txt`, `p3/browser-report.json` |

Final run (4) checks, all asserted by the script:

1. An unauthenticated upload returns `401`, `/app/import` redirects to sign-in,
   and an authenticated cross-origin upload returns `403`.
2. The scanned PDF shows the no-text-layer message; the extraction count is
   unchanged.
3. **The hosting invoice PDF reached real Gemma** (8,499 ms, 1 attempt, 1,044 in
   / 351 out tokens). It produced a `pending_review` candidate with highlighted
   evidence *"Your hosting plan renews on 21 October 2027."* on page 2. The
   renewal count was unchanged before approval, and the page had no horizontal
   overflow at 360 px.
4. The owner edited the title and responsible person. Approve stayed disabled
   until "I checked the highlighted source evidence…" was ticked; the owner then
   confirmed in the dialog.
5. After a reload, the renewal shows due date `2027-10-21`,
   `dateSource=document_confirmed`, the exact `sourceExcerpt`, and the audit
   entry `created_from_document`: *"Due date 2027-10-21 matches verified
   document evidence. Owner-edited fields: title."* The extraction moved to
   `confirmed` with `renewalId`, and there are **0** reminder jobs.
6. Ambiguous `03/04/2027`: the date is empty and both readings are offered; the
   candidate was declined with a reason.
7. Malicious document: 2030-01-01 was not accepted and the injection warning was
   shown; the candidate was declined.
8. No-date letter: no Approve control, and a manual-entry link is offered; the
   candidate was declined.
9. Across the whole run the renewal count rose by **exactly 1**. Zero page errors.

Screenshots: [review 1280](p3/review-invoice-1280.png),
[review 360](p3/review-invoice-360.png),
[saved renewal](p3/renewal-from-document-1280.png),
[ambiguous](p3/review-ambiguous-1280.png),
[injection](p3/review-malicious-1280.png),
[no date](p3/review-no-date-1280.png),
[scanned PDF](p3/scanned-pdf-rejected-1280.png),
[import + history](p3/import-recent-1280.png),
[mobile import](p3/import-recent-360.png).

## Error analysis: real Gemma behaviour observed today

1. **Invalid JSON from whitespace degeneration.** In JSON-schema mode Gemma
   sometimes emits long whitespace runs and never closes the JSON. Seen in
   proof run 1, a manual probe, the mode comparison and browser run 3 (twice in
   a row). Mitigations: one automatic retry for malformed or cut-off answers,
   `max_tokens` lowered from 2048 to 1024 (valid answers used 107–379 tokens),
   and a clear retry state with nothing persisted.
2. **Corrupted or misquoted text inside otherwise valid JSON.** Observed
   examples:
   - ISO `"26-10-2026"` for "14 October 2026";
   - ISO `"2"`;
   - evidence `"Invoice date: 14/10/2066"` (the document says 2026);
   - raw `"2Invoice 21 October 2026 to 20 October 2027"`;
   - evidence `"Service period: 2 end 20 October 2027"`.

   In every case the deterministic parser or the verbatim-evidence check
   discarded the bad value, and a warning was shown. **None reached a save.**
3. **Garbled date with correct evidence** (`"21 October <li>er 2027"`, browser
   run 2). It was first discarded, which was safe but unhelpful. The fix: when
   the verified quote contains exactly one readable date, that date is re-read
   from the quote. The warning names the garbled text, and the status is forced
   to *Needs your decision*. The re-read is never applied to injected lines or
   to quotes containing several dates (unit tested).
4. **Output-mode comparison** (two synthetic TXT fixtures × 3 runs each). These
   numbers are from the console output; the raw responses were not saved to a
   file:
   - `json_schema`: 5/6 valid, 3.4–16.1 s.
   - `json_object`: 0/6 valid, about 41–45 s each; long `<thought>` output was
     cut off.
   - No `response_format`: 0/6 valid, 9.8–44 s.

   JSON-schema mode was kept.
5. **Model variants** (`p3/model-variant-experiment.json`, PDF invoice, 5 runs
   each):
   - 26B at temperature 0: 5/5 valid, 6.9–9.3 s, 3 of 5 *needs decision*.
   - 26B at temperature 0.3: 5/5 valid, 7.8–14.5 s.
   - 31B at temperature 0: 5/5 valid, 12.8–13.4 s, 5/5 *needs decision*.

   All returned the correct 2027-10-21. No configuration change was justified;
   the degeneration is intermittent. Temperature 0 on a hosted endpoint is still
   **not deterministic**: identical inputs produced different outputs.

## Command results

| Command / check | Result | Evidence |
| --- | --- | --- |
| `npm install --save-exact unpdf@1.8.1` | PASS (MIT; bundles PDF.js, Apache 2.0). Same 5 pre-existing high dev-tool advisories | p3-install.txt |
| `npm run lint` | PASS, 0 warnings | p3-lint.txt |
| `npm run typecheck` | PASS | p3-typecheck.txt |
| `npm test` | PASS, 63 tests in 10 files (P2's 20 + 43 new) | p3-test.txt |
| `npm run test:integration` | PASS, 25 tests (14 P2 + 11 P3) on a real ephemeral replica set; the Gemma transport is a labelled synthetic mock | p3-integration.txt |
| `npm run build` | PASS; all P3 routes compiled | p3-build.txt |
| `npm run format:check` | PASS | p3-format-check.txt |
| `npm audit --omit=dev` | PASS, 0 vulnerabilities | p3-audit-production.json |
| `npm run ai:proof` (real Gemma) | Runs 1–2 above | p3/gemma-live-proof*.json |
| Browser acceptance (real Gemma) | 2 pass, 2 safe failures | p3-browser*.txt |
| `next start` production smoke | **BLOCKED by design**: production guards require HTTPS `APP_URL` and Atlas; login returned 503 locally | p3-prod-smoke.txt, p3/prod-bundle-smoke.json |
| Locked docs | Master spec and phase prompts unchanged (SHA-256 identical to P2) | p3/document-hashes.json |

All command logs above were re-run after the last code edit (started 2026-10-14T20:11:30Z).

## Fail-safe coverage (automated)

**Unit tests:**

- deterministic dates: textual, ISO, DD/MM vs MM/DD, impossible dates, 2-digit
  years, relative phrases;
- the verbatim evidence matcher, including context minimisation and email and
  long-number redaction;
- all five fixtures run against labelled synthetic mock answers: a correct
  answer, an issue date chosen wrongly, a wrong ISO, a fabricated amount, a
  computed "30 days" date, ambiguity, a complying injection, a fabricated
  quote, grace periods, competing dates and CAC wording;
- upload checks: MIME, extension and signature mismatches, the 5 MB cap,
  multipart shape and filename sanitisation;
- PDF text layer, scanned, malformed and over-30-page files;
- the adapter: closed-model refusal, model mismatch, timeout, 401, 429, 500,
  oversize and truncation, plus the bounded retry;
- prompt boundary tokens;
- review rendering with escaped model strings and no approve control without
  evidence.

**Integration tests** (real MongoDB):

- unauthenticated, cross-origin and unconfigured uploads persist nothing and
  make no model call;
- scanned and disguised files are rejected before the model;
- a `pending_review` record is stored with no raw text and no email address;
- owner isolation (404);
- confirmation requires `evidenceChecked: true`; extra fields are rejected;
  a date outside the evidence returns 422;
- a single confirmation creates exactly one renewal and no jobs, and a repeat
  returns 409;
- an override is labelled `manual`;
- an ambiguous date can be resolved;
- missing or injected candidates cannot be confirmed even with an override;
- a declined candidate stays final;
- invalid or mismatched answers persist nothing;
- 20 uploads per hour succeed and the 21st returns 429.

## Limitations and open risks

- No Atlas (P2 blocker); no deployed or production-mode run; no OCR; no
  reminders (the P4 hook returns `deferred`).
- Hosted unpaid-tier terms may allow Google to review content; synthetic or
  permitted documents only until a paid tier or self-hosting is in place.
- Model reliability is intermittent (above). Owners may need to retry, and a
  candidate can come back *needs decision* even for clear documents.
- Rate limits are fixed windows, so a short burst at a window boundary can
  exceed the nominal rate. Text extraction runs in-process (a 15 s timeout, but
  no worker isolation).
- Redaction is heuristic (emails and long digit runs) and covers stored context,
  not the full uploaded document, which is never stored.
- One earlier failed-run extraction (run 2) remains `pending_review` in the
  local sandbox. It is visible on `/app/import` and can be declined.
- No commit was made; P0–P3 remain uncommitted pending founder authorization.
