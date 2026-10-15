# P1 interface verification

Completed locally on 2026-10-14 at approximately 16:56 UTC / 17:56 WAT.
P1 only. No P2 implementation, private account, persistent records or provider requests.

## What was implemented

- Restrained navy/teal design tokens, semantic HTML, shared SVG icons, cards,
  buttons/links, labels, status pills, notices, toasts, native dialogs with explicit
  Tab cycling and focus restoration, responsive navigation and skip links.
- Public landing with Nigerian business context, planned document → review →
  reminder flow, value sections and honest synthetic-demo CTA.
- Disabled owner sign-in and explicit public preview entry. Server layout guard
  redirects direct workspace visits to login without the synthetic-preview marker.
- Overview, renewal list/search/category/status filtering, add/detail/edit,
  import metadata checks, synthetic review, notification activity and settings.
- Empty/loading/error examples; overdue/due-soon/renewed statuses; ambiguous,
  missing-date, malformed, unsupported/scanned and unavailable-AI review states.

## Commands actually run

| Command | Outcome | Log |
| --- | --- | --- |
| `npm run lint` | PASS, exit 0, zero warnings | [lint](p1-lint.txt) |
| `npm run typecheck` | PASS, exit 0 | [typecheck](p1-typecheck.txt) |
| `npm test` | PASS, 15 tests across two files | [tests](p1-test.txt) |
| `npm run build` | PASS, exit 0; 11 product routes generated | [build](p1-build.txt) |
| `npm run format` | PASS, exit 0 | [format](p1-format.txt) |
| `npm run format:check` | PASS, exit 0 | [format check](p1-format-check.txt) |
| `node scripts/verify-p1.mjs` | PASS, 33 route/viewport checks, nine interaction groups, zero page runtime errors | [browser output](p1-browser.txt), [JSON](p1/browser-report.json) |
| `git diff --check` | PASS, exit 0; Git line-ending notice only | Executed at final verification |
| Locked document SHA-256 comparison | PASS, unchanged throughout P1 | [hashes](p1/document-hashes.json) |

Browser QA used the installed bundled Playwright package via
`KAI247_PLAYWRIGHT_MODULE`, headless Chromium, locale `en-GB`, local dev server
`http://127.0.0.1:3000`, height 900px and widths **360, 768, 1280px**. This is
desktop browser emulation, not a physical-device, Safari or production test.
No dependencies were added/upgraded for P1; no new clean install was required.

## Browser workflows actually exercised

1. Direct detail route without preview marker → login; owner fields disabled;
   explicit demo entry sets HttpOnly/SameSite=Lax marker.
2. All 11 routes at all three widths; document width never exceeded viewport.
   Notification table has intentional contained horizontal scrolling and a
   keyboard-focusable labeled scroll region. Renewal rows become mobile cards.
3. Mobile navigation expands/collapses; search no-results/clear, category and
   status filters, empty/loading/error states and error recovery.
4. Whitespace title error; form confirmation; repeated Tab remains in dialog;
   Escape closes; focus returns to trigger; toast says nothing saved/scheduled.
5. Mark-renewed preview and edit prefill; reload leaves fixture due date unchanged.
6. Unsupported image and file over 5 MB rejected by UI metadata checks; supported
   TXT still cannot extract. No file contents are read or transmitted.
7. Review cannot approve before explicit confirmation; ambiguous date resets to
   blank; missing/malformed/unsupported/loading/AI failure states cannot approve.
8. Settings preview toast, disabled email-send button, missing-record fallback,
   exit preview and subsequent workspace visit returns to login.
9. Keyboard-first skip link and visible focus outline.

## Screenshots and visual inspection

17 final screenshots saved, listed in the JSON report. Visually inspected the
desktop landing/dashboard/review, mobile landing/dashboard/manual form/dialog,
and complete landing page. Examples:

- [Desktop landing](p1/landing-full-1280.png)
- [Desktop overview](p1/dashboard-full-1280.png)
- [Mobile landing](p1/landing-360.png)
- [Mobile overview](p1/dashboard-360.png)
- [Tablet review](p1/review-768.png)
- [Mobile form](p1/app-renewals-new-360.png)
- [Mobile navigation](p1/navigation-360.png)
- [Keyboard-focused dialog](p1/dialog-360.png)

## Failures found and corrected

- First interaction test selected both the form alert and Next's route announcer;
  scoped the selector to the actual field error. Retained initial failed report
  and output (`p1-browser-initial-failure.txt`, `p1/browser-report-initial-failure.json`).
- Repeated Tab could leave the native modal during browser QA. Added explicit
  first/last focus cycling and previous-focus restoration; rerun passed. Tailwind
  reset also removed modal's automatic margin; restored centering. Retained
  failed output/report and screenshot (`p1-browser-focus-failure.txt`,
  `p1/browser-report-focus-failure.json`, `p1/focus-failure.png`).
- Screenshot inspection found mobile provider text overlapping the date card;
  reserved text space. Kept mobile table actions on one line, corrected nested
  breadcrumbs, preserved document source on edit and removed sample next-renewal
  content from the empty-state scenario.
- Local Next 16.4 docs use error-boundary `retry`, rather than older `reset`.
  The actual implementation follows the installed version's guide.

## Honesty, privacy and remaining gates

All records, dates, amounts, owners, excerpts and notification outcomes are
invented and clearly labeled. UI forms/dialogs only alter temporary component
state. No business data is saved, archived, renewed, extracted, scheduled or sent.
The preview cookie is deliberately not an authentication session; it is safe
only because everything it reveals is a public synthetic fixture. P2 must replace
it and enforce authorization on every private endpoint and owner-scoped query.

Real auth/Atlas (P2), Gemma parsing/extraction (P3), email/scheduling (P4), Render/CI
(P5) and Sentry (P6) remain unimplemented/unverified. SMS/WhatsApp are unavailable.
No partner prize evidence changed. P0's five high development-tool advisories
and deprecated ESLint 9 peer compatibility remain open; no new audit claim is made.

The explicit P1 request authorizes proceeding despite P0's pending commit gate.
No commit/push was made: shared instructions still require founder authorization.
Current branch is `main`; initial commit is
`51c5f2af008eb247340373760b3a0f0793b550d4`, not a P1 commit.
Master and prompt hashes match the P1 starting values. Root tracker and README
are updated; baseline copies under `docs/` are untouched during P1.

A DevRelay community search returned unrelated results, so no community claims
or unrelated citations were used. Installed Next.js guides informed route,
cookie, client/server and error-boundary API usage.

Next: founder reviews P1 locally, then explicitly requests **P2: owner auth,
MongoDB Atlas and manual renewal CRUD**. P2 was not started.
