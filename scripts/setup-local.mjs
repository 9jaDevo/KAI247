import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
const content =
  [
    "# Generated local-only synthetic sandbox configuration. Never commit.",
    "APP_URL=http://127.0.0.1:3000",
    `AUTH_SECRET=${randomBytes(48).toString("base64url")}`,
    "MONGODB_URI=mongodb://127.0.0.1:27018/kai247_local?replicaSet=kai247-local",
    "MONGODB_DB=kai247_local",
    "SEED_OWNER_MODE=synthetic",
    "SEED_OWNER_EMAIL=owner@example.invalid",
    `SEED_OWNER_PASSWORD=${randomBytes(32).toString("base64url")}`,
  ].join("\n") + "\n";
try {
  await writeFile(".env.local", content, { flag: "wx", mode: 0o600 });
  console.log(
    "Local sandbox configuration generated in ignored .env.local. Credentials are not printed. Inspect that local file privately to sign in.",
  );
} catch {
  console.error(
    ".env.local already exists or cannot be written. It was not overwritten. Configure it securely using .env.example.",
  );
  process.exitCode = 1;
}
