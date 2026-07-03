"use client";

import { useEffect, useState } from "react";

export function AdBanner({ dataAdSlot, dataAdFormat = "auto", dataFullWidthResponsive = true } : { dataAdSlot: string, dataAdFormat?: string, dataFullWidthResponsive?: boolean }) {
  const [consentGranted, setConsentGranted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConsentGranted(localStorage.getItem("cookie-consent") === "accepted");
  }, []);

  useEffect(() => {
    if (consentGranted) {
      try {
        // @ts-expect-error This is injected by the AdSense script
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error", e);
      }
    }
  }, [consentGranted]);

  if (!consentGranted) {
    return (
      <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-sm text-slate-400 my-6">
        Werbeanzeige blockiert (Consent fehlt)
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden my-6 flex justify-center">
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_ID || "ca-pub-XXXXXXXXXXXXX"}
        data-ad-slot={dataAdSlot}
        data-ad-format={dataAdFormat}
        data-full-width-responsive={dataFullWidthResponsive.toString()}
      ></ins>
    </div>
  );
}
