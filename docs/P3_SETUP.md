# P3 document extraction setup

P3 adds secure TXT/PDF upload, a real open-weight Gemma extraction adapter,
evidence-checked candidates stored as `pending_review`, and a human review page
where **only an explicit owner confirmation** creates a renewal. P3 does not
implement OCR, email, reminder jobs, cron, telemetry or deployment.

## Model and provider (verified 2026-10-14)

| Item | Value |
| --- | --- |
| Model | `gemma-4-26b-a4b-it`: Gemma 4, 26B-parameter mixture-of-experts (about 3.8B active), instruction-tuned |
| Weights | Open weights, **Apache 2.0** licence ([model card](https://ai.google.dev/gemma/docs/core/model_card_4), [licence](https://ai.google.dev/gemma/apache_2)) |
| Provider | Google AI Studio / Gemini API, OpenAI-compatible endpoint `https://generativelanguage.googleapis.com/v1beta/openai` |
| Identity proof | The provider's own `models` list includes `models/gemma-4-26b-a4b-it`, and every completion echoes `"model": "gemma-4-26b-a4b-it"`. The adapter rejects any response whose reported model is not that Gemma ID. |
| Local inference? | **No.** Inference runs on Google's hosted service. The weights are open, but this deployment does not self-host them. |

**Licence and terms considerations.** Apache 2.0 covers the model weights: it
permits commercial use, modification and redistribution, with notice and
attribution obligations. Using Google's *hosted* endpoint is a separate matter
governed by the [Gemini API Additional Terms](https://ai.google.dev/gemini-api/terms).
Those terms say that on **unpaid** quota, Google may use submitted content to
improve its products, and human reviewers may read it. They also tell users not
to submit sensitive, confidential or personal information to unpaid services.
Paid (billed) usage is handled under a data processing addendum instead. The
terms page does not mention Gemma specifically. The tier of the configured key
was not verified. Until a paid tier or self-hosted Gemma (for example vLLM or
Ollama on Render or DigitalOcean) is in place, **upload synthetic or explicitly
permitted documents only**. The terms also require users to be 18+ and include
regional restrictions. This is an engineering note, not legal advice.

**Why this choice.** The founder-configured key was already set up for this
endpoint. The endpoint's model list showed two Gemma 4 instruction models.
`gemma-4-26b-a4b-it` was faster than `gemma-4-31b-it` in a 5-run comparison on
the same PDF: about 6.9–14.5 s versus about 12.8–13.4 s. Both returned the
correct renewal date in all 5 runs; see
`docs/evidence/p3/model-variant-experiment.json`. The adapter is
provider-neutral, so swapping to a self-hosted Gemma server needs only the three
environment values.

## Configuration

Set these in ignored `.env` / `.env.local`, or in deployment secrets. Never commit them.

```text
GEMMA_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
GEMMA_MODEL_ID=gemma-4-26b-a4b-it
GEMMA_API_KEY=<secret>
```

If any value is missing, or the model ID is not `gemma-*`, `/app/import` shows
**"Gemma extraction is unavailable"** and the upload API returns
`503 AI_NOT_CONFIGURED` / `AI_MODEL_NOT_GEMMA` **before reading the file**.
There is no fallback model and no regex substitute presented as AI.

## Pipeline

`POST /api/extractions`: same-origin check → owner session → configuration check →
rate limits → bounded multipart read → type/signature check → text extraction →
prompt → Gemma → Zod → evidence and date checks → `Extraction(pending_review)` and
an audit event. No Renewal is created at any point in this pipeline.

1. **Upload limits.** Exactly one `file` field, at most 5 MB; the request body is
   read with a hard cap, and a declared `Content-Length` over the cap is refused.
   The declared MIME type, the file extension **and** the content signature must
   agree: `%PDF-` for PDF; valid UTF-8 with no binary control bytes for TXT.
   Filenames are reduced to a safe basename. Rate limits: 20 extractions per
   workspace per hour and 200 overall per hour, in shared MongoDB fixed windows
   keyed by HMAC.
2. **Text extraction.** TXT is decoded as UTF-8. PDFs use the text layer only,
   via [unpdf](https://github.com/unjs/unpdf) 1.8.1 (MIT, bundling Mozilla
   PDF.js, Apache 2.0), with a 15 s parse timeout and a 30-page cap. Image-only
   or scanned PDFs fail with `422 NO_TEXT_LAYER` before any model call.
   Encrypted PDFs fail with `PDF_ENCRYPTED`; malformed ones with
   `MALFORMED_DOCUMENT`. **OCR is not implemented.** The original file is never
   stored; only its SHA-256, the sanitized filename and minimised evidence
   snippets are kept.
3. **Injection-resistant prompt** (`src/lib/ai/prompt.ts`, version `p3-extract-v1`).
   The system message declares the document UNTRUSTED DATA and forbids following
   instructions inside it. It also forbids calculating or inventing dates, and
   explicitly covers relative and statutory/CAC deadlines. The document is
   wrapped in `BEGIN/END-DOCUMENT-<random 96-bit token>` markers, with
   `[page N]` markers for PDFs. Input is capped at 24,000 characters, with a
   truncation warning.
4. **Gemma call** (`src/lib/ai/gemma.ts`). `temperature: 0`, `max_tokens: 1024`,
   a JSON-schema `response_format`, a 60 s timeout, a 256 KB response cap and no
   redirects. The provider-reported model ID must match the configured Gemma ID.
   Malformed or cut-off answers get **one** automatic retry
   (`src/lib/ai/extract.ts`). Credential, rate-limit, timeout and model-identity
   failures are never retried and surface as clear errors.
5. **Validation** (`src/lib/ai/validate.ts`). Zod bounds every field. A date
   survives only if:
   - its quoted evidence is found verbatim in the analysed text (folding only
     whitespace, case and typographic quotes and dashes);
   - the quote does not sit on instruction-like text;
   - the written date occurs in that quote;
   - and it parses deterministically.

   The deterministic reading overrides Gemma's own ISO conversion. Numeric
   dates with both parts ≤ 12 stay **ambiguous** (both readings are shown)
   unless the document states its format. Issue-date, grace-period, competing
   expiry/renewal, filing/statutory and instruction-like text each raise a
   warning or force **Needs your decision**. If Gemma garbles its copy of a
   date but its verified quote contains exactly one readable date, that date is
   re-read from the quote, flagged, and never marked verified. Amounts must
   appear in the document on digit boundaries.
6. **Review** (`/app/import/:id`). The page shows highlighted verbatim evidence
   with up to two lines of context, the page number, provenance (model,
   provider, measured time, fingerprint) and text status badges (not colour
   alone). Fields are editable. An ambiguous date has no default value. The
   owner must tick "I checked the highlighted source evidence". A date outside
   the evidence needs an extra acknowledgement and is saved as `manual`. When no
   evidence-backed date exists, approval is impossible (`422
   NO_EVIDENCE_BACKED_DATE`) and the page offers manual entry. The owner can
   decline with an optional reason.
7. **Confirm** (`POST /api/extractions/:id/confirm`). This runs as one
   transaction: an atomic `pending_review → confirmed` transition (single use,
   `409` on repeat), Renewal creation (`dateSource=document_confirmed` plus the
   exact source excerpt), two audit events, and the `planInitialReminders` P4
   hook, which currently returns `deferred` / 0 jobs.

## Verification commands

```powershell
npm test                      # unit: parsing, evidence, injection, adapter guards, UI
npm run test:integration      # real ephemeral MongoDB; Gemma transport mocked (labelled)
npm run ai:proof              # REAL Gemma on synthetic fixtures (network; may be billed)
$env:KAI247_PLAYWRIGHT_MODULE="<playwright-core dir>"; $env:KAI247_BROWSER_CHANNEL="chrome"
node --env-file=.env.local scripts/verify-p3.mjs   # browser acceptance, real Gemma
```

Fixtures are synthetic and documented in `tests/fixtures/documents/README.md`.
