import type { Metadata } from "next";
import type { AppLocale } from "@/lib/locale";

// Das Save-Popup ist ein reines Funktionsfenster (wird vom Save-Button bzw.
// Bookmarklet geöffnet) und soll nicht in Suchmaschinen auftauchen.
export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Save link - LinkLib" : "Link speichern – LinkLib",
    robots: { index: false, follow: false },
  };
}

export default function SaveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
