import type { Metadata } from "next";

// The save popup is a utility window (opened by the Save Button or bookmarklet)
// and should not appear in search engines.
export const metadata: Metadata = {
  title: "Save Link - LinkLib",
  robots: { index: false, follow: false },
};

export default function SaveLayout({ children }: { children: React.ReactNode }) {
  return children;
}
