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
  metadataBase: new URL("https://www.getlinklib.com"),
  title: "LinkLib - Your Free Cloud Link Library | Organize Bookmarks",
  description: "Organize, save, and manage your favorite websites, bookmarks, and links in a clean folder structure. Free to start and securely stored in the cloud.",
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
  keywords: ["bookmark manager", "save links", "organize bookmarks", "link library", "bookmark folders", "cloud bookmarks"],
  authors: [{ name: "LinkLib" }],
  creator: "LinkLib",
  openGraph: {
    title: "LinkLib - The Smart Bookmark & Link Manager",
    description: "Cloud-based bookmark management. Save URLs with automatic previews and keep everything organized with drag and drop.",
    url: "https://www.getlinklib.com",
    siteName: "LinkLib",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkLib - The Smart Bookmark & Link Manager",
    description: "Cloud-based bookmark management. Save URLs with automatic previews and keep everything organized with drag and drop.",
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

// Structured data for Google Rich Results (Schema.org)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "LinkLib",
  url: "https://www.getlinklib.com",
  description:
    "Organize, save, and manage your favorite websites, bookmarks, and links in a clean folder structure. Free to start and securely stored in the cloud.",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  inLanguage: "en",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Replace this with your own Google AdSense ID later
  const adSensePublisherId = process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-XXXXXXXXXXXXX";

  return (
    <html
      lang="en"
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
