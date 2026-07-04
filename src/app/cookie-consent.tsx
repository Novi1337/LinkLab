"use client";

import { useState, useEffect } from "react";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("cookie-consent");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowBanner(!consent);

    // Reopen banner (for example via "Cookie Settings" in the footer)
    // so consent can be changed or withdrawn at any time
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
          <h3 className="text-lg font-bold text-brand-dark mb-2">We use cookies & personalized advertising</h3>
          <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
            We analyze your saved links (domains and sections) using algorithms to understand your interests and provide personalized advertising (for example via Google AdSense) as well as optimized product features. By clicking &quot;Accept&quot;, you allow us to store cookies and process this data in accordance with GDPR.
            <br />
            <a href="/datenschutz" className="text-primary hover:underline mt-1 inline-block">Read more in our Privacy Policy</a>.
          </p>
        </div>
        <div className="flex shrink-0 gap-3 w-full md:w-auto">
          <button 
            onClick={declineCookies}
            className="flex-1 md:flex-none px-5 py-2.5 rounded-lg border border-slate-300 text-brand-dark font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            Decline
          </button>
          <button 
            onClick={acceptCookies}
            className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover shadow-md transition-all whitespace-nowrap"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
