"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Gift, MessageCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { localizePath, type AppLocale } from "@/lib/locale";

export type ReferralSheetVariant = "default" | "limit" | "postPurchase";

interface ReferralSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  locale?: AppLocale;
  variant?: ReferralSheetVariant;
}

type ReferralInfo = {
  code: string;
  referralCount: number;
  monthsEarned: number;
  monthsCap: number;
  premiumUntil: string | null;
};

function formatDate(iso: string, locale: AppLocale): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

// Ruhiges, nicht-blockierendes Bottom-Sheet fürs Empfehlungsprogramm (statt
// eines zentrierten Modals mit dunklem Backdrop): Das Dashboard bleibt im
// Hintergrund sichtbar, das Teilen fühlt sich nicht wie eine Unterbrechung an.
// Drei Varianten für die drei Trigger-Momente (Aha-Moment, Kapazitätswarnung,
// Post-Purchase-Halo-Effekt) mit jeweils passender Headline/Copy.
export function ReferralSheet({ isOpen, onClose, onUpgrade, locale = "de", variant = "default" }: ReferralSheetProps) {
  const isEn = locale === "en";
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadInfo = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error();
      const res = await fetch("/api/referral", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(typeof body?.error === "string" ? body.error : "");
      }
      setInfo(await res.json());
      setError(null);
    } catch (err) {
      const detail = err instanceof Error && err.message ? ` (${err.message})` : "";
      setError(isEn
        ? `Your referral link could not be loaded. Please try again.${detail}`
        : `Dein Einladungslink konnte nicht geladen werden. Bitte versuche es erneut.${detail}`);
    }
  }, [isEn]);

  useEffect(() => {
    if (!isOpen) return;
    // Via setTimeout(0) entkoppelt, damit kein setState synchron im Effect-Body läuft.
    const t = setTimeout(loadInfo, 0);
    return () => clearTimeout(t);
  }, [isOpen, loadInfo]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const inviteLink = info
    ? `${window.location.origin}${localizePath(`/invite/${info.code}`, locale)}`
    : "";

  const whatsappText = isEn
    ? `Hey! I organize my links with LinkLib. Use my link and get 30 days of Premium as a gift: ${inviteLink}`
    : `Hey! Ich organisiere meine Links mit LinkLib. Über meinen Link bekommst du 30 Tage Premium geschenkt: ${inviteLink}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(isEn ? "Copying failed - please copy the link manually." : "Kopieren fehlgeschlagen - bitte markiere den Link manuell.");
    }
  };

  const headline = {
    default: isEn ? "Get a free month" : "Monat gratis sichern",
    limit: isEn ? "Skip the limit" : "Limit umgehen",
    postPurchase: isEn ? "Welcome to the Premium club" : "Willkommen im Premium-Club",
  }[variant];

  const copy = {
    default: isEn
      ? "Your digital brain is growing! Invite a friend: you both get 1 month of Premium as a gift."
      : "Dein digitales Gehirn wächst! Teile LinkLib mit einem Freund: Ihr bekommt beide 1 Monat Premium geschenkt.",
    limit: isEn
      ? "You're about to reach your limit. Upgrade to unlimited links for 24 EUR/year, or invite a friend and unlock 30 days of Premium instantly."
      : "Du erreichst bald dein Limit. Upgrade jetzt auf unbegrenzte Links für 24 €/Jahr - oder lade einen Freund ein und schalte sofort 30 Tage gratis Premium frei.",
    postPurchase: isEn
      ? "Gift a friend 45 days of free trial time. For every person who signs up, we extend your own subscription by 1 month (up to 6 months)."
      : "Schenke einem Freund 45 Tage kostenlose Testzeit. Für jeden, der sich anmeldet, verlängern wir dein eigenes Abo um 1 Monat (bis zu 6 Monate).",
  }[variant];

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4 pointer-events-none">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300 pointer-events-auto"
      >
        <div className="px-5 pt-5 pb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-brand-dark m-0 flex items-center gap-2">
              <Gift className="w-4.5 h-4.5 text-primary" /> {headline}
            </h3>
            <p className="text-sm text-slate-500 m-0 mt-1.5 leading-relaxed">{copy}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-slate-100 text-muted hover:bg-slate-200 transition-colors"
            title={isEn ? "Close" : "Schließen"}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-5 pb-5 flex flex-col gap-3">
          {error && <p className="text-sm text-danger m-0">{error}</p>}

          {info && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-4 h-4" /> {isEn ? "Share via WhatsApp" : "Über WhatsApp teilen"}
                </a>
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 text-brand-dark font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? (isEn ? "Copied" : "Kopiert") : (isEn ? "Copy link" : "Link kopieren")}
                </button>
              </div>

              {variant === "limit" && onUpgrade && (
                <button
                  onClick={onUpgrade}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors"
                >
                  {isEn ? "Upgrade for 24 EUR/year" : "Upgrade für 24 €/Jahr"}
                </button>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  {isEn ? "Referred: " : "Geworben: "}
                  <strong className="text-brand-dark">{info.referralCount}</strong>
                </span>
                <span>
                  {isEn ? "Bonus months: " : "Bonus-Monate: "}
                  <strong className="text-brand-dark">{info.monthsEarned} / {info.monthsCap}</strong>
                </span>
              </div>

              {info.premiumUntil && new Date(info.premiumUntil) > new Date() && (
                <p className="text-xs text-emerald-700 font-semibold m-0 px-1">
                  ★ {isEn ? "Premium active until" : "Premium aktiv bis"} {formatDate(info.premiumUntil, locale)}
                </p>
              )}
            </>
          )}

          {!info && !error && <p className="text-sm text-slate-500 m-0">{isEn ? "Loading ..." : "Lädt …"}</p>}
        </div>
      </div>
    </div>
  );
}
