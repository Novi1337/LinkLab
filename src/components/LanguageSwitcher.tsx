"use client";

import { usePathname } from "next/navigation";
import { localeFromPathname, switchLocalePath } from "@/lib/locale";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "/";
  const locale = localeFromPathname(pathname);
  const targetLocale = locale === "de" ? "en" : "de";
  const targetPath = switchLocalePath(pathname, targetLocale);

  return (
    <a
      href={targetPath}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-bold tracking-wide text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:text-brand-dark ${className}`}
      aria-label={locale === "de" ? "Sprache auf Englisch wechseln" : "Switch language to German"}
      title={locale === "de" ? "Sprache wechseln: Englisch" : "Switch language: German"}
    >
      <span aria-hidden="true">{locale === "de" ? "🇩🇪" : "🇬🇧"}</span>
      <span>{locale === "de" ? "DE" : "EN"}</span>
      <span className="text-slate-300">|</span>
      <span className="text-slate-500">{locale === "de" ? "EN" : "DE"}</span>
    </a>
  );
}
