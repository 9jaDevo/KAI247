# ai

P3 Gemma extraction path. Model output is untrusted. Nothing in this folder
creates a Renewal; only `confirmExtraction` in `src/lib/extractions` does, after
the owner's explicit confirmation.

- `gemma.ts`: provider-neutral OpenAI-compatible adapter. It accepts only `gemma-*`
  model IDs and checks the model ID the provider reports back.
- `prompt.ts`: injection-resistant prompt. The document is wrapped in random
  boundary markers and treated as data.
- `extract.ts`: the model call plus parsing, with one retry for malformed answers.
- `schema.ts`: the Zod contract and the JSON schema sent as `response_format`.
- `evidence.ts`: verbatim evidence location, minimised context and redaction.
- `date-parse.ts`: deterministic date reading (DD/MM vs MM/DD ambiguity).
- `validate.ts`: fail-safe candidate validation. See `docs/P3_SETUP.md`.
