# Real MongoDB integration tests

npm run test:integration starts its own ephemeral MongoDB replica set and uses
random credentials with two isolated synthetic owners. Tests cover HTTP handler
contracts, CRUD, authorization, validation, transactions, concurrent edits,
expiry/revocation, origin protection, rate limits, archive and cancellation hooks.
The persistent local app database and Atlas are never used by these tests.
