# Owner authentication

P2 uses maintained iron-session sealing, salted native scrypt password hashes,
one-hour sessions with server-side revocation/expiry, shared login rate limits
and current owner/organization lookup on every protected request. Operator-only
provisioning creates isolated owners. Legacy P1 preview actions no longer grant
access. See docs/P2_SETUP.md; do not put credentials in source or logs.
