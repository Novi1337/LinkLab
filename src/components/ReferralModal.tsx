"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Gift } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReferralInfo = {
  code: string;
  referralCount: number;
  rewardGranted: boolean;
  premiumUntil: string | null;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

// Zeigt den persönlichen Einladungslink samt Status der Empfehlungs-Prämie:
// Für die erste erfolgreiche Empfehlung gibt es 3 Monate Premium gratis.
export function ReferralModal({ isOpen, onClose }: ReferralModalProps) {
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadInfo = useCallback(async () => {
    setError(null);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error();
      const res = await fetch("/api/referral", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setInfo(await res.json());
    } catch {
      setError("Dein Einladungslink konnte nicht geladen werden. Bitte versuche es erneut.");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setCopied(false);
    loadInfo();
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

  const referralLink = info ? `${window.location.origin}/?ref=${info.code}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Kopieren fehlgeschlagen - bitte markiere den Link manuell.");
    }
  };

  const rewardActive = !!info?.premiumUntil && new Date(info.premiumUntil) > new Date();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-brand-dark m-0 flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" /> Freunde einladen
            </h3>
            <p className="text-sm text-slate-500 m-0 mt-1">
              Werbe eine Person und erhalte 3 Monate Premium gratis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-muted hover:bg-slate-200 transition-colors text-sm"
            title="Schließen"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {error && <p className="text-sm text-danger m-0">{error}</p>}

          {info && (
            <>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={referralLink}
                  onFocus={(e) => e.target.select()}
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-mono min-w-0"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors flex items-center gap-2 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Kopiert" : "Kopieren"}
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-sm text-slate-600 flex flex-col gap-1.5">
                <span>
                  Bisher geworben: <strong className="text-brand-dark">{info.referralCount}</strong>
                </span>
                {rewardActive && info.premiumUntil ? (
                  <span className="text-emerald-700 font-semibold">
                    ★ Deine Prämie ist aktiv - Premium bis {formatDate(info.premiumUntil)}.
                  </span>
                ) : info.rewardGranted ? (
                  <span>Deine Prämie wurde bereits eingelöst.</span>
                ) : (
                  <span>
                    Registriert sich jemand über deinen Link, erhältst du für die erste Empfehlung{" "}
                    <strong className="text-brand-dark">3 Monate Premium</strong> - werbefrei inkl. Inkognito-Modus.
                  </span>
                )}
              </div>
            </>
          )}

          {!info && !error && <p className="text-sm text-slate-500 m-0">Lade Einladungslink …</p>}

          <p className="text-[11px] text-slate-400 m-0 text-center">
            Gilt nur für neu registrierte Nutzer · Prämie wird einmalig gutgeschrieben
          </p>
        </div>
      </div>
    </div>
  );
}
