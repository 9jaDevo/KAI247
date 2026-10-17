import { describe, expect, it } from "vitest";
import { getSiteUrl } from "../../src/lib/site";
import robots from "../../src/app/robots";
import sitemap from "../../src/app/sitemap";

describe("public SEO origin and indexing boundaries", () => {
  it("uses the founder-selected origin, independent of local authentication", () => {
    expect(getSiteUrl({ APP_URL: "http://localhost:3000" }).href).toBe(
      "https://kai247.pdev.tech/",
    );
    expect(
      getSiteUrl({ SITE_URL: "https://synthetic.example.invalid" }).href,
    ).toBe("https://synthetic.example.invalid/");
  });
  it.each([
    "http://synthetic.example.invalid",
    "https://user:secret@synthetic.example.invalid",
    "https://synthetic.example.invalid/private",
    "https://synthetic.example.invalid/?token=private",
    "https://synthetic.example.invalid/#private",
    "not-a-url",
  ])(
    "rejects unsafe or non-origin SITE_URL without echoing it: %s",
    (value) => {
      expect(() => getSiteUrl({ SITE_URL: value })).toThrow("SITE_URL");
      try {
        getSiteUrl({ SITE_URL: value });
      } catch (error) {
        expect(String(error)).not.toContain(value);
      }
    },
  );
  it("lists only the public homepage, never owner or API records", () => {
    expect(sitemap()).toEqual([{ url: getSiteUrl().href }]);
    expect(robots().rules).toEqual({
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api/"],
    });
    expect(robots().sitemap).toBe(new URL("/sitemap.xml", getSiteUrl()).href);
  });
});
