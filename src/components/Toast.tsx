"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ToastProps {
  isOpen: boolean;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
  onDismiss: () => void;
  /** Automatischer Dismiss nach ms (0 = kein Auto-Dismiss). Default: 8000. */
  autoDismissMs?: number;
}

// Dezente, nicht-blockierende Notification (kein Modal, kein Backdrop, kein
// Blinken/Pulsieren) - für ruhige, seltene Momente wie den "Aha-Moment" nach
// dem 10. gespeicherten Link. Erscheint unten links, damit sie den primären
// Workflow (Speichern/Organisieren) niemals unterbricht.
export function Toast({ isOpen, message, ctaLabel, onCta, onDismiss, autoDismissMs = 8000 }: ToastProps) {
  useEffect(() => {
    if (!isOpen || !autoDismissMs) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [isOpen, autoDismissMs, onDismiss]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-40 sm:max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 px-4 py-3.5 flex items-start gap-3">
        <p className="text-sm text-slate-700 leading-relaxed m-0 flex-1">{message}</p>
        <button
          onClick={onDismiss}
          className="w-6 h-6 shrink-0 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="mt-2 w-full px-4 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
