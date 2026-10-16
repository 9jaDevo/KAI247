# CI

`ci.yml` runs on push, pull request and manual dispatch on Ubuntu 24.04 with
Node pinned by `.node-version`. It performs a clean install, lint, typecheck,
unit/UI tests, native ephemeral MongoDB integration tests and a production build.
No provider secrets or deployment credentials are used. Fork pull requests get
read-only repository permission; checkout credentials are not persisted.

Workflow code is not evidence of a successful hosted run. See the root tracker
and `docs/evidence/p5-verification.md` for the latest actual run status.
