# P5 — Render deployment and CI runbook

This runbook is prepared for `9jaDevo/KAI247`, branch `main`. **Configuration/code is not deployment evidence.** See the root tracker and `docs/evidence/p5-verification.md` for observed results and blocked gates. P5 does not implement Sentry/P6.

Observed P5 release: [live app](https://kai247.onrender.com), web `srv-db8qvg6q1p3s73931peg`, separate Cron `crn-db8raion74is73chvv40`, release `d690810`, [passing CI](https://github.com/9jaDevo/KAI247/actions/runs/38855395748). HTTPS auth/Atlas CRUD/renew/history and real Gemma TXT review/approval pass. Two PDF calls failed safely. Cron's first actual scheduled run exited 2/provider unavailable, zero sends. **Remaining founder action:** configure the email key and verified sender privately in both services, verify a controlled private owner's address and opt in, then perform the authorized TEST. Do not recreate existing services or tick the email gate from these deployment results.

## Release preparation and costs

1. Review the focused P5 diff and authorize its commit/push under the shared phase instructions. Existing baseline `32e07f8a1533b1d46106d4f57715203696897866` is already on GitHub (observed in P5); the older tracker statement that P0–P4 are uncommitted is historical.
2. Push the approved source/workflow and open **GitHub → 9jaDevo/KAI247 → Actions → CI**. A workflow file alone is not a successful run. Record the run's exact URL and commit SHA after all six steps succeed. Fork PRs use no provider credentials: native ephemeral MongoDB and synthetic transports exercise integrations. The workflow has read-only contents permission, no deployment action, and no `pull_request_target`.
3. Choose a Render workspace and region. A **Free web service** is suitable only for an explicitly limited contest/demo deployment: idle spin-down, cold starts, shared usage quotas and no Shell access. Do not call this unattended production reliability. Choose a paid web instance only after founder approval of the dashboard price.
4. **Cron is paid:** Render documents a minimum **US$1/month per Cron service**, with compute prorated by active running seconds. This is a floor, not an upper spending cap. Confirm the selected compute price, workspace quotas/overage controls and founder budget before clicking Create Cron Job. No paid service is authorized merely by this runbook. Gemma/email/Atlas provider costs and quotas are separate.

Current official references (checked during P5): [Next.js on Render](https://render.com/docs/deploy-nextjs-app), [web services](https://render.com/docs/web-services), [Node version selection](https://render.com/docs/node-version), [health checks](https://render.com/docs/health-checks), [free limits](https://render.com/docs/free), [Cron scheduling and billing](https://render.com/docs/cronjobs). Manual dashboard setup is the documented deployment path; no `render.yaml` is supplied or claimed validated.

## Atlas preparation

- Use a dedicated demo database/account with minimum necessary database permissions and synthetic documents. Existing private workspace data must not be put into the public demo owner account.
- In Atlas **Security → Network Access**, allow the outbound IP ranges shown for the selected Render web service **and Cron service**. Obtain them from each service's **Connect → Outbound** panel; do not guess ranges. See [Render outbound addresses](https://render.com/docs/outbound-ip-addresses). Scope network rules deliberately; a global allow-all rule is not required by this guide.
- In Atlas **Database Access**, configure the credential used by both services. Keep the full authenticated `mongodb+srv://...mongodb.net/...` URI outside Git. Set the same `MONGODB_DB` on web, provisioning and Cron; otherwise jobs and accounts land in different databases.
- Required indexes are created idempotently by owner provisioning/application setup: unique user email, owner organization, job idempotency, renewal organization/date/status, job due/status, extraction organization/date and session/rate-limit TTL indexes. Transactions require a replica set; Atlas supports this deployment shape.

## Web service — exact dashboard checklist

1. Open [Render Dashboard](https://dashboard.render.com) → **New → Web Service → Git Provider → GitHub**. Grant Render access to **9jaDevo/KAI247**. Select that repository, not a sample fork. Connect the existing project if one already exists; avoid duplicate services.
2. Set these fields:

   | Field | Value |
   | --- | --- |
   | Name | `kai247` if available; record the actual assigned name/URL |
   | Branch | Approved P5 release branch, normally `main` after publication |
   | Root Directory | Empty (repository root) |
   | Language / Runtime | Node |
   | Region | Founder-selected, preferably near the Atlas region |
   | Instance type | Free demo, or explicitly approved paid tier |
   | Build Command | `npm ci --include=dev && npm run build` |
   | Start Command | `npm run start:render` |
   | Health Check Path | `/api/health` |
   | Auto Deploy | Initially manual; enable after CI checks pass once the workflow is published |

3. Add **Environment** values via the private dashboard (never a screenshot of the populated panel):

   | Variable | Web | Cron | Meaning |
   | --- | --- | --- | --- |
   | `NODE_ENV` | `production` | `production` | Production guards and secure cookies |
   | `NEXT_TELEMETRY_DISABLED` | `1` | optional | Disable Next framework telemetry; not Sentry |
   | `APP_URL` | Actual canonical `https://<assigned-name>.onrender.com` origin | not required | No path/query/fragment; use the actual final URL, not this placeholder |
   | `AUTH_SECRET` | Random high-entropy secret, at least 32 characters | not required | Stable across web restarts; rotation invalidates existing sessions |
   | `MONGODB_URI` | Secret Atlas SRV URI | Same URI | No loopback/dev database in production |
   | `MONGODB_DB` | Dedicated app/demo DB name | Same name | Records, sessions and jobs share the intended database |
   | `GEMMA_API_BASE_URL` | Configured real Gemma endpoint | not required | Hosted model, not a closed-model replacement |
   | `GEMMA_MODEL_ID` | Actually available `gemma-*` ID | not required | Prior local proof used `gemma-4-26b-a4b-it`; deployed identity must be rechecked |
   | `GEMMA_API_KEY` | Secret provider key | not required | Synthetic/permitted documents only until provider tier/privacy reviewed |
   | `EMAIL_API_KEY` | Secret Resend key | Same key/account | Required for real verification/test/scheduled sending |
   | `EMAIL_FROM` | Verified sender address/domain | Same sender | Not a recipient setting; recipient derives from verified owner |

   `.node-version` pins Node 24.11.1; remove any conflicting Render `NODE_VERSION` override or set it to the same version. `PORT` is supplied by Render; the startup wrapper validates it, binds `0.0.0.0` and defaults to 10000. Build tools are explicitly included despite production NODE_ENV.

4. Do not upload `.env`/`.env.local` as source or a Render Secret File. Local `.env.local` currently overrides Atlas with a loopback DB; importing it would break deployment. Render environment values are set explicitly. Configure the real HTTPS origin before accepting logins; there is no external OAuth callback in this credential-based MVP.
5. Click **Deploy Web Service** only once access, source and any selected spending are authorized. Follow **Events/Logs** until **Live**. Open its actual HTTPS URL and `/api/health` signed out. Readiness returns only ready/NOT_READY and performs a DB ping; missing auth/DB configuration, inaccessible DB or a slow check returns 503. AI/email outages do not masquerade as core DB failures; their own feature states remain visible.
6. If the assigned URL differs from `APP_URL`, update APP_URL, save/redeploy, then log in. In browser DevTools verify the real session cookie is Secure + HttpOnly + SameSite=Lax. Do not capture cookie values. A local assertion of cookie flags is not public TLS proof.

## Provision an isolated owner

Do not seed on every web start/build. Provision once with an explicit `SEED_OWNER_MODE=synthetic` (.invalid email, no mail) or `private` (your controlled mailbox, no sample records). Use random credentials stored privately. The seed command leaves existing credentials/data unchanged.

- **Paid service with Shell:** Render service → **Shell**. Temporarily add `SEED_OWNER_MODE`, `SEED_OWNER_EMAIL`, `SEED_OWNER_PASSWORD` and optional `SEED_WORKSPACE_NAME` privately, run `npm run owner:setup`, then remove the seed password variables. Do not screenshot shell input or credentials.
- **Free service without Shell:** provision from a trusted local terminal against the same intended Atlas database using a separately reviewed ignored environment file. For example: `node --env-file=.env.render-setup scripts/seed-owner.mjs`. The file must contain the production HTTPS APP_URL, auth secret, Atlas settings and explicit seed values; do not reuse the loopback `.env.local`. Remove temporary seed credentials from deployment settings after setup; retain account credentials in your password manager.

The updated `npm run owner:setup` accepts `.env`/`.env.local` if present but also works solely from Render environment values. Provisioning never prints account passwords. The public synthetic sandbox cannot verify `.invalid` mailboxes; use a separate private owner account for the real-email test.

## Separate Cron service — requires spending approval

1. After the founder approves the dashboard compute rate and at least the documented $1/month minimum, **Render → New → Cron Job → Git Provider → 9jaDevo/KAI247**.
2. Same approved branch and root directory; Node runtime and matching region. Set **Build Command** `npm ci --include=dev`, **Command** `npm run reminders:process`, **Schedule** `*/15 * * * *` (UTC). This polls persisted UTC due times; the planner alone applies organization-local 09:00 and offsets. No web keep-alive or in-memory interval is used.
3. Add the Cron variables from the matrix above. No Gemma, seeding or web session secret is needed. Confirm the Atlas database/name and sender match the web app. Cron has no persistent disk requirement and no public scheduler HTTP endpoint.
4. Create the job only after cost approval. On **Runs → Trigger Run**, verify the command exits. Exit 0 is a completed batch, possibly zero due jobs; exit 2 means provider unavailable (zero claims/sends), exit 1 means configuration/service failure. Save the real run ID, UTC timestamp, status and sanitized counts. A zero-job run proves execution, not email delivery.
5. Prefer a scheduled run as additional evidence. Render permits one active run per Cron service, but manually triggering while active cancels that run; expired MongoDB leases recover work. Do not force repeated runs to trigger email bursts.

## Deployed acceptance and evidence

- New signed-out browser: HTTPS landing and safe health ready; `/app` redirects to login and unauthenticated private API returns 401.
- Synthetic owner: create a domain for a future date, reload, edit, reload, renew with next date and reload its audit history. Restart/redeploy the web service and confirm Atlas still has the same record.
- Upload `tests/fixtures/documents/hosting-invoice-two-dates.pdf`; confirm actual Gemma model ID, pending candidate, exact excerpt and no renewal before review. Owner explicitly edits/approves; reload shows the persisted record. Keep model errors visible instead of substituting fixtures.
- Controlled private owner: follow [P4 setup](P4_SETUP.md), prove mailbox possession, save explicit opt-in, then request the conspicuous TEST. No arbitrary recipient or due-date mutation. Record real provider acceptance separately from actual inbox receipt. Missing key/sender/address verification remains blocked.
- Cron: record a real completed run and counts; check pending/attempted/accepted/failed/cancelled history, and old-version invalidation on renewal. Delivered requires an actual verified receipt; current implementation has no delivered webhook.
- Capture landing/settings/activity/approval on the live app and Render Events/Run/CI pages. Avoid Environment panels, credentials, cookie values, private addresses and document text. If blocked, capture the actual safe failed state and label it; never fabricate dashboard screenshots or deployment URLs.
- Optional scripted smoke checks must be pointed at the verified target and labelled synthetic. `scripts/verify-p5-production.mjs` is explicitly **local** production-bundle + isolated Atlas + real Gemma evidence, not a Render deployment. It does not send mail.

## Ephemeral filesystem and rollback

Business data, audit events, extracted metadata, sessions, rate limits, mailbox proofs and reminder jobs live in Atlas. TXT/PDF bytes are parsed transiently in memory; raw originals are not persisted. The web/worker code does not use `.local/mongodb`, which belongs only to `npm run db:local`; do not run that command on Render. Next build/static caches are disposable. No disk, Redis, local queue or extra service is required. Verify the deployed restart/read path before claiming persistence on Render.

If deploy fails, preserve redacted logs and the last successful deploy SHA; fix configuration or select the previous successful deployment in Render Events/rollback controls. Roll back web and Cron to compatible code together. A rollback does not undo Atlas data/audits or recall provider-accepted emails. Pending jobs must remain version/opt-in checked. If recipient/scheduling safety is uncertain, suspend Cron and opt out the affected controlled workspace before further runs; do not delete audit/job records. Review schema compatibility before any future database migration.
