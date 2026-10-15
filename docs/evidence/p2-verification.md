# P2 verification and handoff

Verified locally on **2026-10-14**. P2 only. The owner workflow works against real
local MongoDB, but the master spec's **MongoDB Atlas exit gate remains blocked**
because no Atlas credentials/connection were provided. P3 has not started.

## Implemented and verified

- Real owner credential authentication, salted scrypt password hashes,
  iron-session sealed cookies, one-hour expiry, database revocation/TTL, logout,
  shared login limits, protected app pages/API handlers and current owner/org lookup.
- Official MongoDB driver with pooled connection, required indexes and replica-set
  transactions; complete domain interfaces for User, Organization, Renewal,
  Extraction, ReminderJob and AuditEvent.
- Strict Zod-validated manual create/read/edit/archive/renew and settings;
  scoped queries; immutable server-owned organization/source fields; bounded JSON;
  same-origin mutations; object-ID validation; safe error responses and escaped UI.
- Real dashboard/list/forms/details/settings and persisted audit history.
  Business-local date statuses and inclusive 30-calendar-day windows use the
  organization's IANA timezone. Amounts are integer minor units.
- Optimistic version conflicts, concurrent-edit protection, archive without
  deletion, completion notes/history and atomic cancellation of obsolete jobs.
  Replacement dates start a new active cycle; completed count means records
  renewed at least once. “Previously renewed” filtering uses completion metadata.
- Explicit isolated synthetic sandbox. No shared hardcoded password, public
  auto-login or account registration. P1's preview marker no longer grants access.

## Actual command results

| Command / check | Result | Evidence |
| --- | --- | --- |
| Dependency installs | PASS; pinned mongodb 7.7.0, iron-session 9.0.1, dev-only mongodb-memory-server-core 11.3.0 | p2-install.txt, p2-test-db-install.txt |
| Local DB startup | PASS; native MongoDB 8.2.6, loopback replica set, persistent WiredTiger directory | p2-local-db.txt |
| Local configuration generation | PASS; random secrets stored only in ignored .env.local; no values printed | scripts/setup-local.mjs, ignore checks |
| Owner provisioning | PASS; isolated synthetic owner and two synthetic records; hashed password | p2-seed.txt |
| `npm run lint` | PASS, exit 0, zero warnings | p2-lint.txt |
| `npm run typecheck` | PASS, exit 0 | p2-typecheck.txt |
| `npm test` | PASS, 20 tests across four files | p2-test.txt |
| `npm run test:integration` | PASS, 14 tests against a real separate ephemeral replica set | p2-integration.txt |
| `npm run build` | PASS, exit 0; protected routes/API handlers compile | p2-build.txt |
| `npm run format:check` | PASS, exit 0 | p2-format-check.txt |
| Browser success story and UI QA | PASS, eight groups, 33 route/viewport checks, zero runtime errors | p2-browser.txt, p2/browser-report.json |
| Database-process restart | PASS; replacement date, completion and version persisted | p2/restart-before.json, p2/restart-after.json, p2-local-db-restart.txt |
| Fresh HTTP login/read after restart | PASS; login/read HTTP 200, same stored record; session revoked afterward | p2-restart-http.txt, p2/restart-http.json |
| Production dependency audit | PASS, zero advisories | p2-audit-production.json |
| Full dependency audit | FAIL, five existing high development lint dependency advisories | p2-audit.json |
| Secret/data ignore checks | PASS; .env.local and .local/mongodb ignored; .env.example trackable | git check-ignore executed |
| Locked doc hashes / whitespace | PASS; master/phase prompt unchanged; git diff --check exit 0 | p2/document-hashes.json |

No new clean install was claimed; actual dependency installs ran and locked the
versions. Browser QA used bundled Playwright/headless Chromium at 360/768/1280px,
locale en-GB, against the local dev app. It is not physical-device, Safari,
production HTTPS, Render or Atlas evidence.

## Real browser success demo

The JSON report records the actual stored synthetic record ID and final fields.
The browser used generated local credentials without printing them:

1. Unauthenticated page/API visits and forged legacy preview marker were denied.
2. Owner signed in with a real password; local cookie was HttpOnly/SameSite=Lax.
3. Created a synthetic domain renewal for **2027-06-15**, amount **1234567** minor
   units. Reload and a fresh authenticated API read retained the data and audit.
4. Edited title and amount to **1240010** minor units; reload retained version 2.
5. Marked renewed with replacement due date **2028-06-15**; reload retained version
   3, completion timestamp, completion notes and created/updated/renewed history.
6. Search/no-results, origin rejection, safe owner response and empty real
   notification activity passed. Settings saved; email sending stayed disabled.
7. All 11 product routes fit each tested width, with no document-level overflow.
8. Logout revoked the server session, including replay of the old sealed cookie.

Ten actual screenshots were saved under `p2/`. Visually inspected desktop history
and the mobile overview. Examples: [stored history](p2/renewal-history-1280.png),
[mobile overview](p2/dashboard-360.png), [tablet details](p2/renewal-768.png),
[mobile settings](p2/settings-360.png). The completed-stat caption was clarified
after capture to “Completed renewals”; its count/meaning did not change.

The local database was then shut down cleanly via an admin command guarded to
127.0.0.1:27018, restarted using the same ignored data directory, and re-read.
The helper's first process exited when its database was intentionally stopped;
that is not reported as a spontaneous failure or a passing scheduler test.
Persistence and new HTTP login/read both passed after restart. This is a DB
restart test, **not** the deferred P4 reminder-worker recovery gate.

## Integration coverage

Two owners with generated credentials use distinct organizations in a separate
ephemeral database. Tests cover unique/expiry indexes, salted hashes, valid and
invalid credentials, missing/forged/expired/revoked sessions, cookie flags,
CRUD/read persistence, cross-owner read/update/archive/renew rejection,
organization/operator injection, impossible dates, negative/fractional amounts,
bad IDs, literal regex search, missing/cross-site origin, oversized JSON,
stale/concurrent versions, audited renewal/cancellation, no new jobs, preference
isolation, rejection of arbitrary recipients/unverified opt-in, archive retention,
and shared login throttling. Unit tests additionally verify local-day boundaries,
leap-year/calendar arithmetic, production-local-DB rejection and XSS-safe text.

## Failures corrected and retained

- First seed failed because native Node strip-only TypeScript does not support
  constructor parameter properties. Explicit fields fixed it; seeding passed.
  Retained `p2-seed-initial-failure.txt`.
- First integration run could not start tests because Vitest 5 has no
  `describe.sequential` helper. Default sequential tests/file isolation replaced
  it; the real-MongoDB suite passed. Retained `p2-integration-initial-failure.txt`.
- First lint run rejected JSX inside a query try/catch and warned about relative
  full-document navigation. Query error handling now precedes rendering; auth
  transitions use an absolute same-origin document URL to clear router data.
  Retained `p2-lint-initial-failure.txt`.
- Clarified previously renewed filtering so a completed old cycle with a new
  active date remains discoverable. Added an actual integration assertion.

## Remaining gates and next action

**Atlas is blocked, not complete.** Configure a development Atlas URI/database
securely and request a P2 Atlas round-trip verification. Pooling/index code and a
local test do not prove Atlas use. Partner evidence remains unchanged/unverified.

No Gemma extraction, file parsing, new reminder scheduling, delivery, cron,
Sentry, CI or deployment was implemented. Import/review remains a labeled UI
illustration; notification history displays actual stored jobs only. Production
Secure cookies/HTTPS and production behavior have not been exercised. The five
existing dev-tool advisories remain open; runtime dependency audit is clean.

No commit/push was authorized or performed. Branch `main` still points at initial
SHA `51c5f2af008eb247340373760b3a0f0793b550d4`; P0–P2 work is uncommitted.
The root tracker is live; source master and phase prompt hashes are unchanged.

See [P2 setup](../P2_SETUP.md) for commands, model semantics and security limits.
Complete the Atlas gate before claiming P2 fully complete or moving to P3 without
an explicitly documented founder exception. The app and local DB are left running
for review; credentials stay in ignored `.env.local`.

The DevRelay search returned unrelated posts; no community claim or unrelated
citation was used. Session behavior follows maintained
[iron-session documentation](https://github.com/vvo/iron-session), installed Next
guides, and actual tests. No connection proof was inferred from a dependency.
