"use client";

import { useState, useEffect } from "react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("cookie-consent");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowBanner(!consent);
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
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl z-50 p-6 sm:p-8 animate-in slide-in-from-bottom-full duration-300">
      <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-brand-dark mb-2">Wir verwenden Cookies & personalisierte Werbung</h3>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            Wir werten die von dir gespeicherten Links (Domains und Sektionen) durch Algorithmen aus, um deine Interessen zu erkennen und dir personalisierte Werbung (z. B. über Google AdSense) sowie optimierte Funktionen anzuzeigen. Mit dem Klick auf &quot;Zustimmen&quot; erlaubst du uns die Speicherung von Cookies und die Analyse dieser Daten gemäß der DSGVO.
            <br />
            <a href="/datenschutz" className="text-primary hover:underline mt-1 inline-block">Weitere Informationen in der Datenschutzerklärung</a>.
          </p>
        </div>
        <div className="flex shrink-0 gap-3 w-full md:w-auto">
          <button 
            onClick={declineCookies}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-lg border border-slate-300 text-brand-dark font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Ablehnen
          </button>
          <button 
            onClick={acceptCookies}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover shadow-md transition-all whitespace-nowrap"
          >
            Zustimmen
          </button>
        </div>
      </div>
    </div>
  );
}
