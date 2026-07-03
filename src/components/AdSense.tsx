"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function AdSense({ pId }: { pId: string }) {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    // Check initial consent state on load
    if (localStorage.getItem("cookie-consent") === "accepted") {
      setConsentGranted(true);
    }
    
    // Listen to custom event dispatched when user accepts cookies in the banner
    const handleConsent = () => {
      if (localStorage.getItem("cookie-consent") === "accepted") {
        setConsentGranted(true);
      }
    };
    
    window.addEventListener("consent-changed", handleConsent);
    return () => window.removeEventListener("consent-changed", handleConsent);
  }, []);

  if (!consentGranted) return null;

  return (
    <Script
      // Der globale Google AdSense Header (wird nur geladen, wenn Consent erteilt wurde)
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
