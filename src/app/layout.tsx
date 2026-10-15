import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KAI247 AI · KAI247",
  description:
    "A clearer view of business renewals. Explore the KAI247 AI interface with synthetic demo data.",
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
