# P7 demo package — target 2 minutes 40 seconds

**No screen recording or finished video was created.** Browser screenshots and a shot-by-shot script are ready. This is a real local app + Atlas + hosted Gemma + real Resend TEST walkthrough with synthetic documents/records, not a new Render deployment. The owner mailbox is private. Do not show Settings' email field, credentials, mailbox headers, verification code, environment files or provider dashboards containing keys.

## Shots and narration

| Time | Screen/action | Suggested narration |
| --- | --- | --- |
| 0:00–0:15 | Public page or `01-import.png`, synthetic workspace label visible | “A small business can have hosting, insurance and agreement dates scattered across documents. KAI247 brings the source, the confirmed date and reminder history together. All records in this demo are synthetic.” |
| 0:15–0:35 | Import `tests/fixtures/benchmark/p7/walkthrough-hosting.txt`; `01-import.png` | “This invoice has an issue date and a renewal date. The app sends its text to a real hosted open-weight Gemma model. It is not private local inference, and no renewal is created yet.” |
| 0:35–1:00 | `02-review.png`; source quote and other issue date visible | “The candidate quotes ‘Hosting renews on 21 October 2027’. The issue date is separate. I check the evidence and edit the title. This observed model call took 24.36 seconds.” If trimming the wait, display **‘wait shortened; actual model time 24.36s’**. |
| 1:00–1:15 | `03-explicit-confirmation.png`, then `04-renewal-scheduled.png` | “Only explicit confirmation saves the renewal. The record persists in Atlas. Verified owner opt-in enables four deterministic jobs at 30, 7, 1 and zero days, at 09:00 Africa/Lagos.” |
| 1:15–1:35 | `05-real-test-activity.png` | “The controlled TEST went only to the verified owner. This is an actual attempt and provider acceptance. The founder confirmed receipt and the TEST label. The app keeps provider-accepted status because it has no delivery webhook.” Do not expose the private mailbox. |
| 1:35–2:00 | `06-mark-renewed.png`, `07-renewed-reloaded.png`, `08-cancelled-and-new-jobs.png` | “Marking renewed records an owner-entered replacement date, increments the version and cancels obsolete jobs. The new date is manual; the previous invoice does not prove it. This walkthrough included a second synthetic cycle to verify a provenance bug fix; no payment occurred.” |
| 2:00–2:25 | Both benchmark `REPORT.md` tables, in readable editor/browser | “We tested 16 synthetic texts twice without changing the model pipeline or labels. First run: two complete outputs and fourteen errors. Full repeat: fifteen outputs, ten documents strictly correct, tying the simple regex baseline. The repeat date field was correct on fourteen of sixteen. Failures remain available.” |
| 2:25–2:40 | P6 Sentry screenshot and limitations slide | “Evidence checks and human review matter: amount context, uncertainty and hosted reliability still fail. No OCR, SMS, WhatsApp, payments or compliance certification. Pricing and customer demand remain hypotheses.” |

The screenshots show the actual QA history: initial date 2027-10-21 → version 2, 2028-10-21 (provenance defect retained) → version 3, 2029-10-21 after the fix. Do not edit the video to suggest those are one unchanged date or a real purchase. For a fresh recording, use a new synthetic record and make one deliberate replacement date after the fix.

## Actual asset paths

All PNGs are in `docs/evidence/p7/`: `01-import.png`, `02-review.png`, `03-explicit-confirmation.png`, `04-renewal-scheduled.png`, `05-real-test-activity.png`, `06-mark-renewed.png`, `07-renewed-reloaded.png`, `08-cancelled-and-new-jobs.png`, `09-mobile-renewal.png`. `failure-provenance-before-fix.png` is failure evidence, not a successful final state.

Actual data/provider proof: `walkthrough-stages.json`, `email-verification.json`, `founder-receipt.json`. Actual benchmark: `run-01/{results.json,results.csv,REPORT.md}` and `run-02/{results.json,results.csv,REPORT.md}`. Sentry: `docs/evidence/p6/sentry-gemma.png` and its verified trace URL in P6 report. Published app/repo: https://kai247.onrender.com and https://github.com/9jaDevo/KAI247, currently P5 release; do not present P6/P7 local changes as deployed.

## Commands and remaining founder steps

Inspect reproducible results without another provider request:

```powershell
node scripts/report-p7.mjs docs/evidence/p7/run-01
node scripts/report-p7.mjs docs/evidence/p7/run-02
```

For the existing private walkthrough on this machine, the ignored `.local/p7-private.json` contains the synthetic workspace's private login and explicit environment. Keep it private. The local QA launcher is `node .local/run-p7-dev.mjs`, URL `http://127.0.0.1:3017`. It is intentionally not a public credential/seed script. A fresh checkout must follow README/P2 setup to provision its own owner and verification rather than reusing credentials. The QA account is opted out after demonstration; re-enable only when deliberately testing. Do not run its worker on future scheduled dates just to trigger an email. Use the owner-only TEST, limited to one per ten minutes.

1. Review labels/results, failure analysis and the screenshot set; decide which original/repeat result views to show. Preserve both runs in linked evidence.
2. Choose your installed screen recorder, select only the app window, and test a short recording with microphone narration. No recorder/capture API was available to the agent, so recorder availability is not claimed.
3. Set the browser to a readable desktop layout, hide private tabs, and keep “SYNTHETIC” in the workspace/record title. Capture the shots in order, using this script. For a fresh model call, keep or visibly label any trimmed waiting time and retain failures.
4. Insert a readable result table with **both** runs, explicit denominators and small-sample limits. Do not substitute the repeat for the original or call the 674.5ms failure-dominated median inference speed.
5. Export a 1080p MP4 (or your recorder's supported readable format), check the whole video for private data, legible dates and audio, then upload to a founder-chosen accessible video host. This upload/publication is not performed by P7.
6. Open the video signed out and verify playback/access, save its real URL in the tracker, and only then mark video recorded/reviewed. No URL or recording is invented here. P8 article/submission is a separate phase.
