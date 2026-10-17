import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl, siteDescription, siteName } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: siteName,
  title: {
    default: "KAI247 AI | Business Renewal Tracker for Nigerian SMEs",
    template: "%s | KAI247 AI",
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName,
    title: "KAI247 AI — Clarity for everything that's due",
    description: siteDescription,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: "KAI247 AI — Business Renewal Tracker",
    description: siteDescription,
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  category: "business",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
