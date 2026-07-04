import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["de", "en"],
  defaultLocale: "de",
  // 'as-needed': Deutsch bleibt ohne Präfix unter / erreichbar (bestehende
  // URLs und Google-Rankings bleiben erhalten), Englisch liegt unter /en.
  localePrefix: "as-needed",
  // Kein automatischer Redirect anhand Browser-Sprache: Crawler und Nutzer
  // sehen unter jeder URL stabilen Inhalt (SEO), gewechselt wird per Switcher.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
