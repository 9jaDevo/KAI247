import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KAI247 AI",
    short_name: "KAI247",
    description: "Clarity for everything that's due.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9f7",
    theme_color: "#0b766e",
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
