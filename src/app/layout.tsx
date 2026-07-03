import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieConsent } from "./cookie-consent";
import { AdSense } from "@/components/AdSense";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LinkLib - Deine kostenlose Link-Bibliothek | Lesezeichen organisieren",
  description: "Organisiere, speichere und verwalte deine Lieblings-Websites, Bookmarks und Links übersichtlich in Ordnern. Komplett kostenlos und sicher in der Cloud.",
  keywords: ["Lesezeichen verwalten", "Links speichern", "Bookmark Manager", "Link-Bibliothek", "Ordner System für Links", "Cloud Bookmarks"],
  authors: [{ name: "LinkLib" }],
  creator: "LinkLib",
  openGraph: {
    title: "LinkLib - Der smarte Bookmark & Link Manager",
    description: "Cloud-basiertes Lesezeichen-Management. Speichere URLs mit automatischen Vorschaubildern und sortiere sie per Drag & Drop.",
    url: "https://getlinklib.com",
    siteName: "LinkLib",
    images: [{
      url: "https://getlinklib.com/og-image.jpg", 
      width: 1200,
      height: 630,
      alt: "LinkLib Dashboard Vorschau"
    }],
    locale: "de_DE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Ersetze diese ID später durch deine eigene von Google AdSense
  const adSensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-XXXXXXXXXXXXX";

  return (
    <html
      lang="de"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <CookieConsent />
        <AdSense pId={adSensePublisherId} />
      </body>
    </html>
  );
}
