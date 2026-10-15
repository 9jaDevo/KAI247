# P2 owner workspace setup

P2 implements real owner sign-in and persistent manual renewal management. It
does not implement Gemma extraction, notification delivery, cron or deployment.
The current verification used **local MongoDB 8.2.6**, not MongoDB Atlas.

## Local synthetic sandbox

Requirements: Node 22.18+ or 24 LTS, npm, network access for the first MongoDB
binary download, and available loopback ports 3000/27018. Run from the repo root.

```powershell
npm ci
npm run setup:local
npm run db:local
```

Keep the database command running in that terminal. In another terminal:

```powershell
npm run owner:setup
npm run dev
```

`setup:local` creates ignored `.env.local` only when absent. It generates random
auth/session and owner password values without printing them, configures the
local database, and selects an explicitly **synthetic** owner. It refuses to
overwrite existing configuration. The owner email/password can be inspected
privately in that local file; never paste them into chat or commit them.

Open the exact `APP_URL` configured in that file (the generated URL is
`http://127.0.0.1:3000`). Hostnames must match: `localhost` and `127.0.0.1` are
different origins for cookies and mutation checks. Sign in using the generated
owner credentials. Existing P1 public-preview cookies do not authorize access.

`db:local` runs a real single-node replica set, bound to loopback, with WiredTiger
storage under ignored `.local/mongodb`. It is not an in-memory fake and is not
Atlas. Transactions require a replica set. The dev-only helper downloads a pinned
MongoDB 8.2.6 binary through `mongodb-memory-server-core`; it is not an app service
dependency. Data survived a controlled database-process restart during P2 QA.
Do not expose this unauthenticated local instance; production runtime validation
requires an authenticated Atlas SRV URI instead.

Seeding creates an isolated owner/organization and **only synthetic records** in
synthetic mode. Demo email addresses must end in `.invalid`. The UI permanently
labels that workspace as a synthetic sandbox. No other owner's data is shared.
If the email already exists, setup does not replace its password or records.
There is no public registration, password reset or hardcoded shared password.

## Atlas gate (currently blocked)

Create/use a development Atlas cluster and least-privileged database user, allow
the intended development IP, and securely configure `MONGODB_URI` and
`MONGODB_DB` in `.env.local`. Never paste the URI into chat. Atlas must support
transactions; the app deliberately does not fall back to local files or an
in-memory store if the database is unavailable.

The same pooled official driver and index initializer are used for local and
Atlas connections. A configured URI or installed SDK is not an Atlas connection
proof. P2's Atlas gate requires a real scoped create/read/edit/renew round trip
against that development cluster. This has **not** run yet.

Operator provisioning supports explicit `SEED_OWNER_MODE=private` with securely
supplied `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD` (12–128 characters) and optional
`SEED_WORKSPACE_NAME`; private mode adds no synthetic records. Do not run this
against a production database without authorization. All verification in this
phase used synthetic owners and local/ephemeral development databases only.

Production auth requires an HTTPS `APP_URL`, a strong `AUTH_SECRET` of at least
32 characters, and an authenticated Atlas `mongodb+srv` URI. Secure cookies and
deployed HTTPS have not been browser-verified here; Render deployment remains P5.

## Workflow and contracts

Sign in → New renewal → confirm date and save → reload → edit → mark renewed with
a later replacement date → reload and inspect history. Currency amounts are
stored as integer minor units, and due dates remain `YYYY-MM-DD` date-only values.
Dashboard statuses use the **organization's IANA timezone**, including local-day
boundaries. Workspace timezone changes retain date strings, increment record
versions and invalidate obsolete future jobs transactionally.

Renewing marks the previous cycle completed (`renewedAt`/`completedAt`), records
an audit event, increments `version`, and keeps the replacement date **active**.
The completed dashboard count is the number of records renewed at least once,
not the total number of historical cycles. The “Previously renewed” filter uses
completion metadata. Archive retains the record and history and excludes it from
default lists; it does not delete data.

API responses use `{ success, data?, error? }`. Owner-controlled IDs are strictly
validated and every query/mutation is scoped to the authenticated organization.
Manual create always sets `dateSource=manual`; callers cannot supply organization,
owner, status, source evidence or model-derived fields. PATCH takes the complete
editable form plus expected `version`; renew/archive also require expected
version. Stale/concurrent writes return 409. Search treats regex characters as
literal text and returns at most 500 scoped records; dashboard counts use all
current owner records.

Mutation requests require JSON (where a body is needed), stay below 32 KB, and
must carry an Origin matching `APP_URL`. Missing/cross-site origins fail. Errors
do not expose raw DB/configuration errors or submitted credentials. Source text,
notes and titles are rendered as escaped React text, never injected HTML.

Passwords use salted Node scrypt (`N=32768, r=8, p=3`, 64-byte output). Session
payloads are sealed using maintained [iron-session](https://github.com/vvo/iron-session),
contain no password data, expire after one hour, and are backed by a MongoDB
record keyed by a SHA-256 digest of a random token. Each protected request checks
expiry, revocation and current owner/organization membership. Logout revokes the
server record and expires the cookie; auth transitions use a fresh document
navigation to clear previous router data. Local HTTP cookies are HttpOnly and
SameSite=Lax; production adds Secure. Login limits are shared in the database:
10 attempts per normalized email and 200 globally per 15-minute bucket. This
beta policy can temporarily lock an account under repeated failed attempts.

Email preference storage is available, but recipient verification and sending
are not. Arbitrary verified recipients are rejected; opt-in cannot be enabled
without a verified owner address. Renewal/edit/archive/settings cancellation
hooks invalidate existing pending/claimed jobs only. P2 creates no new jobs,
uses no web-process timers and sends nothing.

## Verification commands

```powershell
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run build
npm run format:check
```

Integration tests launch their own real, ephemeral MongoDB replica set, use
generated credentials and separate owners, and clean up only that test instance.
They do not read local owner credentials or mutate the app's persistent database.

For optional browser QA, install Playwright separately or set
`KAI247_PLAYWRIGHT_MODULE` to the installed Codex bundle module directory, keep
the app and local DB running, then execute:

```powershell
node --env-file=.env.local scripts/verify-p2.mjs
```

This requires synthetic mode, leaves a clearly named synthetic verification
record for inspection, revokes its session afterward, redacts environment secrets
from reports, and captures screenshots under `docs/evidence/p2/`. The P1 browser
script/report is historical; its unauthenticated preview flow was replaced in P2.
See [P2 verification](evidence/p2-verification.md) for actual results and gates.
