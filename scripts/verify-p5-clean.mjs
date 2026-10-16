// Run CI commands in an isolated source copy with no .env files/provider variables.
// Does not publish, deploy, seed accounts or send email.
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { openSync, closeSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";
const root = process.cwd();
const output = join(root, "docs/evidence/p5");
const workspace = join(root, ".local", `p5-clean-${Date.now()}`);
await mkdir(workspace, { recursive: true });
await mkdir(output, { recursive: true });
const roots = [
  "src",
  "tests",
  "scripts",
  ".github",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.mjs",
  "next-env.d.ts",
  "postcss.config.mjs",
  "eslint.config.mjs",
  "vitest.config.ts",
  "vitest.integration.config.ts",
  ".node-version",
  ".prettierignore",
];
for (const item of roots)
  await cp(join(root, item), join(workspace, item), { recursive: true });
const env = {
  ...process.env,
  CI: "true",
  NEXT_TELEMETRY_DISABLED: "1",
  MONGOMS_DOWNLOAD_DIR: join(root, ".local/p5-mongo-binaries"),
};
for (const key of Object.keys(env))
  if (
    /^(APP_URL|AUTH_SECRET|MONGODB_|GEMMA_|EMAIL_|SENTRY_|SEED_|RENDER_|SMOKE_|KAI247_)|^NODE_ENV$/.test(
      key,
    )
  )
    delete env[key];
const steps = [
  ["install", ["ci", "--include=dev"]],
  ["lint", ["run", "lint"]],
  ["typecheck", ["run", "typecheck"]],
  ["unit", ["test"]],
  ["integration", ["run", "test:integration"]],
  ["build", ["run", "build"]],
];
const report = {
  timestampUtc: new Date().toISOString(),
  scope:
    "Isolated local source copy, no environment files/provider secrets; NOT a hosted GitHub Actions run",
  platform: process.platform,
  node: process.version,
  steps: [],
  outcome: "running",
};
for (const [name, args] of steps) {
  const fd = openSync(join(output, `clean-${name}.txt`), "w");
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    args,
    {
      cwd: workspace,
      env,
      shell: process.platform === "win32",
      windowsHide: true,
      stdio: ["ignore", fd, fd],
      timeout: 600000,
    },
  );
  closeSync(fd);
  report.steps.push({ name, exitCode: result.status });
  console.log(`${name}: ${result.status === 0 ? "PASS" : "FAIL"}`);
  if (result.status !== 0) {
    report.outcome = "FAIL";
    process.exitCode = 1;
    break;
  }
}
if (report.outcome === "running") report.outcome = "PASS";
const version = (await readFile(resolve(root, ".node-version"), "utf8")).trim();
report.expectedNode = version;
await writeFile(
  join(output, "clean-report.json"),
  JSON.stringify(report, null, 2),
);
