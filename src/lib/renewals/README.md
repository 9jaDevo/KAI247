# Owner-scoped renewal services

service.ts handles validated manual CRUD, archive, version conflicts, completion
history and transactional cancellation hooks. dates.ts uses organization-local
calendar dates. validation.ts enforces strict input shapes and integer minor
amounts. P1 preview-fixtures.ts remains only historical UI/test data; live owner
screens use stored documents. No model calls, new reminder jobs or emails in P2.
