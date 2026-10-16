# P7 synthetic evaluation set

`dataset.json` contains 16 entirely synthetic TXT documents and hand-authored expected labels. No real company, official deadline, address or customer record is represented. The implementation agent wrote the texts and labels before the first inference call; **independent human/domain-expert annotation has not occurred**. Founder review is a remaining evidence-quality limit, not an invented approval.

Coverage: hosting; policy/insurance; vehicle licensing; contract; explicit fictional filing notice; relative filing instruction without a date; no-date letter; competing dates; invoice issue/renewal/grace; ambiguous numeric date and declared DD/MM control; malicious AI instruction; historical/deposit/balance amount distractors; valid leap date; impossible date; payment received without a renewal date.

All labels are literal constants. `dates` and `rawDates` are predeclared acceptable answers. Most have one answer; the competing-services case allows either explicit renewal **only with an ambiguous status**. The DD/MM case requires null primary ISO and exactly both readings. The impossible date requires null ISO/unsupported status. Missing primary dates require null raw/ISO/evidence and unknown type. These choices are fixed before model output, not inferred by a judge model.

Evidence receives credit only when the output quote is a whitespace-normalized substring of the source and includes a prewritten reference clause. This is intentionally stricter than accepting a plausible date alone. Casing/whitespace are normalized for provider/raw/evidence; date/type/status/amount/currency are exact. No synonym grading or LLM judge is used. The full ten-field conjunction is also reported. A failed inference scores zero for every field, including expected-null fields.

For an uploadable TXT, copy the `text` of one object verbatim to a `.txt` file. The P7 walkthrough has its own clearly labeled hosting sample; do not replace failed benchmark cases with successful walkthrough samples.

These short, mostly structured documents are a small convenience set with a provider-label/template bias. They test text extraction semantics, **not OCR/PDF layout, domain representativeness, production accuracy or independent user validation**. The app's existing prompt/validator already saw related P3 fixture categories; this is not a held-out research test set. Do not claim state-of-the-art performance from it.
