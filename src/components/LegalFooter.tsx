"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeFromPathname, localizePath, type AppLocale } from "@/lib/locale";

/**
 * Kompakte Fußzeile mit allen rechtlich erforderlichen Links.
 * Der Button "Cookie-Einstellungen" öffnet den Consent-Banner erneut,
 * damit Nutzer ihre Einwilligung jederzeit widerrufen können (Art. 7 Abs. 3 DSGVO).
 */
export function LegalFooter({ className = "", locale }: { className?: string; locale?: AppLocale }) {
  const pathname = usePathname();
  const currentLocale = locale ?? localeFromPathname(pathname);
  const isEn = currentLocale === "en";

  const openCookieSettings = () => {
    window.dispatchEvent(new Event("open-cookie-settings"));
  };

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-400 ${className}`}>
      <Link href={localizePath("/impressum", currentLocale)} className="hover:text-primary transition-colors">{isEn ? "Legal notice" : "Impressum"}</Link>
      <Link href={localizePath("/datenschutz", currentLocale)} className="hover:text-primary transition-colors">{isEn ? "Privacy" : "Datenschutz"}</Link>
      <Link href={localizePath("/agb", currentLocale)} className="hover:text-primary transition-colors">{isEn ? "Terms" : "AGB"}</Link>
      <Link href={localizePath("/widerruf", currentLocale)} className="hover:text-primary transition-colors">{isEn ? "Right of withdrawal" : "Widerrufsbelehrung"}</Link>
      <button
        type="button"
        onClick={openCookieSettings}
        className="hover:text-primary transition-colors cursor-pointer"
      >
        {isEn ? "Cookie settings" : "Cookie-Einstellungen"}
      </button>
    </nav>
  );
}
