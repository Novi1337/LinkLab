export type AppLocale = "de" | "en";

export function localeFromPathname(pathname?: string | null): AppLocale {
  if (!pathname) return "de";
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "de";
}

export function localizePath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") {
    return normalized === "/" ? "/en" : `/en${normalized}`;
  }
  return normalized;
}

export function switchLocalePath(pathname: string, targetLocale: AppLocale): string {
  const basePath = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return localizePath(basePath, targetLocale);
}
