"use client";

import Link from "next/link";

/**
 * Compact footer with all legally required links.
 * The "Cookie Settings" button reopens the consent banner,
 * so users can change or withdraw consent at any time (Art. 7(3) GDPR).
 */
export function LegalFooter({ className = "" }: { className?: string }) {
  const openCookieSettings = () => {
    window.dispatchEvent(new Event("open-cookie-settings"));
  };

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 ${className}`}>
      <Link href="/impressum" className="hover:text-primary transition-colors">Legal Notice</Link>
      <Link href="/datenschutz" className="hover:text-primary transition-colors">Privacy Policy</Link>
      <Link href="/agb" className="hover:text-primary transition-colors">Terms & Conditions</Link>
      <Link href="/widerruf" className="hover:text-primary transition-colors">Right of Withdrawal</Link>
      <button
        type="button"
        onClick={openCookieSettings}
        className="hover:text-primary transition-colors cursor-pointer"
      >
        Cookie Settings
      </button>
    </nav>
  );
}
