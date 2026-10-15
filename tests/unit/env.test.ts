import { describe, expect, it } from "vitest";
import { validateEnv } from "../../src/lib/security/env";

describe("server environment validation (synthetic values only)", () => {
  it("boots P0 with no credentials and treats blanks as unavailable", () => {
    expect(
      validateEnv({ AUTH_SECRET: "", GEMMA_API_KEY: " " }).AUTH_SECRET,
    ).toBeUndefined();
    expect(validateEnv({}).APP_URL).toBe("http://localhost:3000");
  });
  it.each(["auth", "db", "ai", "notifications"] as const)(
    "requires credentials when %s is requested",
    (capability) => {
      expect(() => validateEnv({}, [capability])).toThrow(
        "Missing required environment",
      );
    },
  );
  it("does not leak invalid values in errors", () => {
    try {
      validateEnv({ GEMMA_API_BASE_URL: "synthetic-private-value" });
    } catch (error) {
      expect(String(error)).toContain("GEMMA_API_BASE_URL");
      expect(String(error)).not.toContain("synthetic-private-value");
      return;
    }
    throw new Error("Expected configuration rejection");
  });
  it("rejects unsafe auth configuration", () => {
    expect(() => validateEnv({ AUTH_SECRET: "short" }, ["auth"])).toThrow(
      "32 characters",
    );
    expect(() =>
      validateEnv({ NODE_ENV: "production", AUTH_SECRET: "x".repeat(32) }, [
        "auth",
      ]),
    ).toThrow("HTTPS");
  });
  it("accepts complete synthetic configuration without making connections", () => {
    expect(
      validateEnv(
        { MONGODB_URI: "mongodb://localhost:27017", MONGODB_DB: "synthetic" },
        ["db"],
      ).MONGODB_DB,
    ).toBe("synthetic");
  });
  it("rejects an invalid database protocol", () => {
    expect(() =>
      validateEnv(
        { MONGODB_URI: "https://example.invalid", MONGODB_DB: "synthetic" },
        ["db"],
      ),
    ).toThrow("MONGODB_URI");
  });
  it("rejects non-HTTP application and model URLs", () => {
    expect(() => validateEnv({ APP_URL: "file:///tmp/example" })).toThrow(
      "APP_URL",
    );
    expect(() =>
      validateEnv({ GEMMA_API_BASE_URL: "ftp://example.invalid" }),
    ).toThrow("GEMMA_API_BASE_URL");
  });
});
