import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://acmocliq.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ACM Studio par Ocliq",
  description: "L’espace de travail des courtiers québécois pour créer, présenter et convertir une analyse comparative du marché.",
  openGraph: {
    title: "ACM Studio",
    description: "L’analyse comparative, en toute confiance.",
    locale: "fr_CA",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ACM Studio — L’analyse comparative, en toute confiance." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ACM Studio",
    description: "L’analyse comparative, en toute confiance.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr-CA">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
