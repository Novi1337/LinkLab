"use client";

import Link from "next/link";

/**
 * Kompakte Fußzeile mit allen rechtlich erforderlichen Links.
 * Der Button "Cookie-Einstellungen" öffnet den Consent-Banner erneut,
 * damit Nutzer ihre Einwilligung jederzeit widerrufen können (Art. 7 Abs. 3 DSGVO).
 */
export function LegalFooter({ className = "" }: { className?: string }) {
  const openCookieSettings = () => {
    window.dispatchEvent(new Event("open-cookie-settings"));
  };

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 ${className}`}>
      <Link href="/impressum" className="hover:text-primary transition-colors">Impressum</Link>
      <Link href="/datenschutz" className="hover:text-primary transition-colors">Datenschutz</Link>
      <Link href="/agb" className="hover:text-primary transition-colors">AGB</Link>
      <Link href="/widerruf" className="hover:text-primary transition-colors">Widerrufsbelehrung</Link>
      <button
        type="button"
        onClick={openCookieSettings}
        className="hover:text-primary transition-colors cursor-pointer"
      >
        Cookie-Einstellungen
      </button>
    </nav>
  );
}
