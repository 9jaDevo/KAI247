# P7 model, costs and operating tradeoffs

Checked 2026-10-16. Distinguish published prices, prior observed configuration and an actual paid invoice. No infrastructure plan, subscription or billing setting was changed for P7.

## Model and licence

The configured extraction adapter uses **`gemma-4-26b-a4b-it`**, with the response identity recorded per actual successful call. It is hosted through the Google AI Studio OpenAI-compatible endpoint. “OpenAI-compatible” describes the HTTP protocol; no OpenAI/GPT or closed Gemini model substitutes for Gemma extraction. It is hosted inference, not local/self-hosted inference.

Google's [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4) identifies the family as open-weight and Apache 2.0. The [licence text](https://ai.google.dev/gemma/apache_2) requires licence/notices preservation and change notices when redistributing relevant work. This app calls a hosted endpoint and does not redistribute weights. Open weights make a future provider/self-hosting choice possible; we have not demonstrated private local processing, lower cost or better accuracy from that possibility. Provider service terms and project dependency licences are separate from the weight licence. This is attribution/engineering documentation, not legal advice.

## Costs with evidence boundaries

| Item | What has actually been observed | What is not known |
| --- | --- | --- |
| Render web | Existing public service deployed in P5; no P7 tier/compute change | Current invoice/total web charge not inspected in P7 |
| Render Cron | P5 dashboard smallest service showed USD 0.00016/active minute and minimum USD 1/month, founder approved. Separate every-15-minute worker exists; original run had provider unavailable | Full monthly usage/invoice; P7 does not claim Cron email configuration was fixed |
| Gemma provider | Actual calls and reported token counts in benchmark attempt records. Google's current [pricing page](https://ai.google.dev/gemini-api/docs/pricing#gemma-4) lists Gemma 4 input/output free-tier pricing as free, paid tier unavailable | Actual account billing/quota entitlement and invoice were not inspected. No cost is inferred from Sentry's estimated cost display |
| MongoDB Atlas | Existing Atlas connection used for an isolated synthetic walkthrough DB | Account tier/storage/backups/invoice not inspected in P7; “free hosting” is not claimed |
| Resend | Existing adapter/key used for authorized mailbox verification and, only after verification/opt-in, controlled TEST | Account plan/quota/invoice and inbox deliverability beyond this actual test are not established |
| Sentry | P6 genuine ingestion and dashboard trace evidence; P7 benchmark disables telemetry to avoid duplicate fixture trace noise | Account quota/retention/billing not audited; local evidence is not proof of deployed P6 instrumentation |

The benchmark report supplies observed input/output token counts where the provider returns them, including successful responses later rejected by schema validation. Transport failures may have consumed provider work without returning usage. Summing available counts is a lower bound on reported usage, not a bill or a per-customer unit-economics proof. No actual payment, revenue or customer savings was measured.

## Privacy

Only synthetic document texts are used. Real owner email is supplied privately and stored in an isolated authenticated Atlas workspace for the requested verification/test; it is excluded from public evidence/screenshots. No private mailbox contents are read by the agent. Owner enters the mailbox code directly; signing in alone never proves mailbox control. Email opt-in is explicit.

Document text is transmitted to the hosted model. [Provider terms](https://ai.google.dev/gemini-api/terms#unpaid-services) distinguish unpaid and paid processing; unpaid content may be used to improve products and reviewed by humans, with regional/account conditions. We have not verified the founder's applicable billing tier. Do not upload confidential customer documents until the founder assesses those terms, retention, permissions and relevant data-protection obligations. A permissive model weight licence does not itself make this hosted service private.

The app keeps transient uploads, file hashes, minimized excerpts, candidate fields and audit records rather than relying on Render disk for business persistence. Authentication, organization scoping and human review remain required. Sentry uses the P6 allowlist; raw prompts/documents, private addresses, credentials and arbitrary errors are excluded. P7 stores raw benchmark responses only because the source set is explicitly synthetic. Do not reuse that output-recording harness on confidential documents.

## Engineering limits to show in the demo

- Hosted requests can time out or return malformed/truncated JSON. Keep each failed case and distinguish transport availability from extraction correctness. No silent regex fallback is called AI.
- Evidence/date parsing reduces unsupported prefills, but does not establish that a chosen amount/date is the right business obligation. The owner must inspect context. Relative statutory dates are never calculated.
- Calendar arithmetic, versioned jobs and leased claims are deterministic; email acceptance is not delivery, and at-least-once processing cannot promise exactly-once receipt.
- No OCR, live SMS/WhatsApp, legal certification, payments or automatic renewals. No benchmark on scanned or layout-rich PDFs was run in P7.
- The small synthetic evaluation is inspectable, not independent human validation. No actual feedback quote or recorded video exists unless the evidence report later explicitly records it.
- P6/P7 source is uncommitted/undeployed pending founder publication authorization. Existing Render evidence belongs to P5. No P8 article/submission work is included.
