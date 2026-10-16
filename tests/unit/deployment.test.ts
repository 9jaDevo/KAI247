import { describe, it, expect, vi, afterEach } from "vitest";
import { randomBytes } from "node:crypto";
import { validateProductionConfig } from "../../src/lib/security/deployment.ts";
import { readiness } from "../../src/lib/health.ts";
const config = {
  APP_URL: "https://synthetic.example.invalid",
  AUTH_SECRET: randomBytes(48).toString("hex"),
  MONGODB_URI: "mongodb+srv://synthetic:placeholder@cluster.mongodb.net/",
  MONGODB_DB: "synthetic_test",
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
describe("production launch requirements (synthetic config; no connections)", () => {
  it("accepts HTTPS origin and Atlas without requiring optional email/AI keys", () =>
    expect(validateProductionConfig(config).MONGODB_DB).toBe("synthetic_test"));
  it.each([
    "http://synthetic.example.invalid",
    "https://localhost",
    "https://127.0.0.1",
    "https://synthetic.example.invalid/app",
    "https://user:password@synthetic.example.invalid",
    "https://synthetic.example.invalid?x=1",
    "https://synthetic.example.invalid/#x",
  ])("rejects invalid public origin %s", (APP_URL) =>
    expect(() => validateProductionConfig({ ...config, APP_URL })).toThrow(),
  );
  it("rejects local database and weak or missing auth", () => {
    expect(() =>
      validateProductionConfig({
        ...config,
        MONGODB_URI: "mongodb://127.0.0.1:27017",
      }),
    ).toThrow("Atlas");
    expect(() =>
      validateProductionConfig({ ...config, AUTH_SECRET: "short" }),
    ).toThrow("32 characters");
    expect(() =>
      validateProductionConfig({ ...config, AUTH_SECRET: undefined }),
    ).toThrow("AUTH_SECRET");
  });
});
describe("public readiness privacy and failure semantics", () => {
  function configure() {
    for (const [k, v] of Object.entries(config)) vi.stubEnv(k, v);
    vi.stubEnv("NODE_ENV", "production");
  }
  it("is no-store and reports only readiness after an actual checker resolves", async () => {
    configure();
    const ping = vi.fn(async () => ({ ok: 1, private: "not exposed" }));
    const response = await readiness(ping);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({
      success: true,
      data: { status: "ready" },
    });
    expect(ping).toHaveBeenCalledOnce();
  });
  it("fails closed on missing config before calling database", async () => {
    configure();
    vi.stubEnv("AUTH_SECRET", "");
    const ping = vi.fn();
    const response = await readiness(ping);
    expect(response.status).toBe(503);
    expect(ping).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain("AUTH_SECRET");
  });
  it("redacts database errors, addresses and credentials", async () => {
    configure();
    const response = await readiness(async () => {
      throw new Error(config.MONGODB_URI + config.AUTH_SECRET);
    });
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      success: false,
      error: { code: "NOT_READY", message: "Service is not ready." },
    });
  });
  it("returns unavailable within four seconds for a hung database", async () => {
    configure();
    vi.useFakeTimers();
    const response = readiness(() => new Promise(() => {}));
    await vi.advanceTimersByTimeAsync(4000);
    expect((await response).status).toBe(503);
  });
});
