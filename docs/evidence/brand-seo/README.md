# Logo, favicon and technical SEO evidence

Founder requested extraction/use of the supplied brand board and selected `https://kai247.pdev.tech` as primary URL. Only public branding/metadata changes; no new partner feature, customer record, provider send or account configuration. Master/prompts remain locked. Assets/prompts and exact deployment/Search Console steps: `docs/BRANDING_SEO.md`.

## Executed checks

- 114 unit tests/16 files pass, including 8 new origin-validation/indexing-boundary tests; `test.txt`. Auth/DB/reminder business logic was not changed; integration suite not rerun for this branding/metadata scope.
- Initial lint failed on a social-card apostrophe; initial typecheck failed because ProcessEnv inferred NODE_ENV as required in synthetic test inputs. Fixed the JSX entity and declared the helper's input record explicitly. Original failed logs retained; final actual command outputs `lint.txt`, `typecheck.txt`, `build.txt`.
- Actual local HTTP checks: homepage canonical/title/description/OG/Twitter/parsed JSON-LD; robots and sitemap; login noindex; API X-Robots-Tag; ICO three frames;48/180/192/512px PNG sizes; manifest and1200×630 social PNG. `http-checks.json`. No private organization mutations or external model/email calls.
- Initial HTTP harness expected a trailing slash in raw canonical markup. Next normalizes the root canonical to slashless HTML; URL normalization verifies the equivalent actual URL. Original failure kept in `http-initial-probe-failed.json`; no application workaround was needed.
- Visual inspection found that the first inline transparent PNG did not paint in the social card despite HTTP200/correct dimensions. `social-initial-missing-logo.png` retains that failure. A background-flattened JPEG derivative with explicit numeric image dimensions now paints correctly; `social-preview.png` was actually rendered and inspected. Encoding and dimensions changed together; no unisolated single-cause claim or measured performance improvement is made.
- Browser: actual logo images loaded, accessible home link preserved, desktop screenshot;360px client/scroll width345 (no horizontal overflow). Reversed white login logo loaded; computed filter brightness(0) invert(1), actual noindex/nofollow metadata. `landing-desktop.png`, `landing-mobile.png`, `login-reversed.png`. Temporary viewport reset.
- Existing custom domain fetched over HTTPS200 with OLD deployed title: `custom-domain-baseline.json`. This does not establish deployment of these changes, current favicon indexing or Google Search Console acceptance.

## Boundaries

Local production bundle/HTTP and browser evidence are distinct from public deployment. Canonical, structured data and sitemap use the founder-selected domain; authentication APP_URL remains separate and existing authorization remains required. Robots directives are not a security boundary. No Search Console token, DNS verification, indexing, ranking or new hosted CI/deploy result is invented. Existing P5/P7/P8/S1 blockers remain unchanged. Founder subsequently explicitly authorized commit and push to main; Git records the release SHA. Push alone does not verify deployment.
