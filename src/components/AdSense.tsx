"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

export function AdSense({ pId }: { pId: string }) {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    // Check initial consent state on load
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsentGranted(localStorage.getItem("cookie-consent") === "accepted");
    
    // Listen to custom event dispatched when user accepts cookies in the banner
    const handleConsent = () => {
      setConsentGranted(localStorage.getItem("cookie-consent") === "accepted");
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
