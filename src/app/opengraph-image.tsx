import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getSiteUrl } from "@/lib/site";

export const alt =
  "KAI247 AI — Clarity for everything that's due. Business renewal tracking with human-reviewed Gemma extraction.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function SocialImage() {
  const logo = await readFile(
    join(process.cwd(), "public/brand/logo-social.jpg"),
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "70px 80px",
          background: "#f3f8f6",
          color: "#132f39",
          justifyContent: "space-between",
        }}
      >
        {/* ImageResponse requires its own img with inlined bytes, not next/image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="KAI247 AI"
          src={`data:image/jpeg;base64,${logo.toString("base64")}`}
          width={430}
          height={117}
          style={{ width: 430, height: 117, flexShrink: 0 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 60, letterSpacing: -2, lineHeight: 1.1 }}>
            Clarity for everything that&apos;s due.
          </div>
          <div style={{ fontSize: 26, color: "#536c72" }}>
            Business renewals. Source evidence. Your confirmation.
          </div>
        </div>
        <div style={{ display: "flex", color: "#0b766e", fontSize: 22 }}>
          Built for Nigerian business owners · {getSiteUrl().hostname}
        </div>
      </div>
    ),
    size,
  );
}
