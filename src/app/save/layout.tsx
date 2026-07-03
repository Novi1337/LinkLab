import type { Metadata } from "next";

// Das Save-Popup ist ein reines Funktionsfenster (wird vom Save-Button bzw.
// Bookmarklet geöffnet) und soll nicht in Suchmaschinen auftauchen.
export const metadata: Metadata = {
  title: "Link speichern – LinkLib",
  robots: { index: false, follow: false },
};

export default function SaveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
