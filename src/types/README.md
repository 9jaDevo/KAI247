# Domain contracts

domain.ts defines User, Organization, Renewal, Extraction, ReminderJob, AuditEvent,
owner context, session records and serialized UI views. Object IDs and Date fields
stay in MongoDB; API/client views serialize only appropriate owner-scoped fields.
preview.ts contains only legacy P1 synthetic fixture contracts.
