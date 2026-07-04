"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { localeFromPathname, localizePath } from "@/lib/locale";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const isEn = locale === "en";

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("cookie-consent");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowBanner(!consent);

    // Banner erneut öffnen (z. B. über "Cookie-Einstellungen" im Footer),
    // damit die Einwilligung jederzeit geändert/widerrufen werden kann
    const handleOpenSettings = () => setShowBanner(true);
    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => window.removeEventListener("open-cookie-settings", handleOpenSettings);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShowBanner(false);
    // Trigger custom event so AdSense scripts on the page load immediately without a hard refresh
    window.dispatchEvent(new Event("consent-changed"));
  };

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined");
    setShowBanner(false);
    // Ensure no tracking scripts are loaded
    window.dispatchEvent(new Event("consent-changed"));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 p-6 sm:p-8 animate-in slide-in-from-bottom-full duration-300">
      <div className="max-w-shell mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-brand-dark mb-2">{isEn ? "We use cookies & personalized advertising" : "Wir verwenden Cookies & personalisierte Werbung"}</h3>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            {isEn
              ? "We analyze your saved links (domains and sections) using algorithms to understand your interests and show personalized ads (for example via Google AdSense), as well as optimized features. By clicking \"Accept\", you allow us to store cookies and analyze this data in accordance with GDPR."
              : "Wir werten die von dir gespeicherten Links (Domains und Sektionen) durch Algorithmen aus, um deine Interessen zu erkennen und dir personalisierte Werbung (z. B. über Google AdSense) sowie optimierte Funktionen anzuzeigen. Mit dem Klick auf \"Zustimmen\" erlaubst du uns die Speicherung von Cookies und die Analyse dieser Daten gemäß der DSGVO."}
            <br />
            <a href={localizePath("/datenschutz", locale)} className="text-primary hover:underline mt-1 inline-block">{isEn ? "More information in our privacy policy" : "Weitere Informationen in der Datenschutzerklärung"}</a>.
          </p>
        </div>
        <div className="flex shrink-0 gap-3 w-full md:w-auto">
          <button 
            onClick={declineCookies}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-lg border border-slate-300 text-brand-dark font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            {isEn ? "Decline" : "Ablehnen"}
          </button>
          <button 
            onClick={acceptCookies}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover shadow-md transition-all whitespace-nowrap"
          >
            {isEn ? "Accept" : "Zustimmen"}
          </button>
        </div>
      </div>
    </div>
  );
}
