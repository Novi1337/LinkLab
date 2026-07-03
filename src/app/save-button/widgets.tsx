"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Interaktive Bausteine der Save-Button-Doku-Seite:
 * Code-Snippet mit Kopieren-Button sowie das Bookmarklet.
 */

export function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard-API nicht verfügbar – Nutzer kann manuell markieren
    }
  };

  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 rounded-2xl p-4 pr-24 text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
      >
        {copied ? "Kopiert ✓" : "Kopieren"}
      </button>
    </div>
  );
}

export function BookmarkletLink() {
  const ref = useRef<HTMLAnchorElement>(null);

  // React blockiert javascript:-URLs in JSX-Attributen, daher wird das
  // Bookmarklet-Href nach dem Mount direkt am DOM-Element gesetzt.
  useEffect(() => {
    const origin = window.location.origin;
    const code =
      "javascript:(function(){window.open('" +
      origin +
      "/save?url='+encodeURIComponent(location.href)+'&title='+encodeURIComponent(document.title),'linklib-save','noopener,noreferrer,scrollbars=yes,resizable=yes,width=480,height=640');})();";
    ref.current?.setAttribute("href", code);
  }, []);

  return (
    <a
      ref={ref}
      onClick={(e) => e.preventDefault()}
      title="Ziehe mich in deine Lesezeichenleiste"
      className="inline-flex items-center gap-2 bg-white border border-slate-200 text-brand-dark px-5 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all cursor-grab select-none"
    >
      <img src="/Favicon.svg" alt="" className="w-5 h-5" />
      Auf LinkLib speichern
    </a>
  );
}
