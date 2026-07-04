import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { CookieConsent } from "./cookie-consent";
import { AdSense } from "@/components/AdSense";
import "./globals.css";
import type { AppLocale } from "@/lib/locale";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.getlinklib.com"),
  title: "LinkLib - Deine kostenlose Link-Bibliothek | Lesezeichen organisieren",
  description: "Organisiere, speichere und verwalte deine Lieblings-Websites, Bookmarks und Links übersichtlich in Ordnern. Komplett kostenlos und sicher in der Cloud.",
  applicationName: "LinkLib",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/Favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/Favicon.svg", type: "image/svg+xml" }],
    shortcut: ["/Favicon.svg"],
  },
  keywords: ["Lesezeichen verwalten", "Links speichern", "Bookmark Manager", "Link-Bibliothek", "Ordner System für Links", "Cloud Bookmarks"],
  authors: [{ name: "LinkLib" }],
  creator: "LinkLib",
  openGraph: {
    title: "LinkLib - Der smarte Bookmark & Link Manager",
    description: "Cloud-basiertes Lesezeichen-Management. Speichere URLs mit automatischen Vorschaubildern und sortiere sie per Drag & Drop.",
    url: "https://www.getlinklib.com",
    siteName: "LinkLib",
    locale: "de_DE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkLib - Der smarte Bookmark & Link Manager",
    description: "Cloud-basiertes Lesezeichen-Management. Speichere URLs mit automatischen Vorschaubildern und sortiere sie per Drag & Drop.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

// Strukturierte Daten für Google Rich Results (Schema.org)
const baseJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LinkLib",
  url: "https://www.getlinklib.com",
  description:
    "Organisiere, speichere und verwalte deine Lieblings-Websites, Bookmarks und Links übersichtlich in Ordnern. Komplett kostenlos und sicher in der Cloud.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "de",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: AppLocale }>;
}>) {
  const { locale } = await params;

  const jsonLd = {
    ...baseJsonLd,
    inLanguage: locale,
    description:
      locale === "en"
        ? "Organize, save, and manage your favorite websites, bookmarks, and links in a clean cloud library."
        : baseJsonLd.description,
  };

  // Ersetze diese ID später durch deine eigene von Google AdSense
  const adSensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-XXXXXXXXXXXXX";

  return (
    <html
      lang={locale}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <CookieConsent />
        <AdSense pId={adSensePublisherId} />
      </body>
    </html>
  );
}
