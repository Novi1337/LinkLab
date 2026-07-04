"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Plan = "premium" | "premium_plus" | "lifetime";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Anzeige-Infos der Pläne. Die echten Preise/Price-IDs liegen ausschließlich
// serverseitig in Stripe - hier stehen nur Beschriftungen fürs UI.
const PLANS: { id: Plan; name: string; price: string; hint: string; features: string[]; highlight?: boolean }[] = [
  {
    id: "premium",
    name: "Premium",
    price: "12 €",
    hint: "per year, cancel anytime",
    features: ["Unlimited tabs, sections, and subsections", "Completely ad-free"],
  },
  {
    id: "premium_plus",
    name: "Premium+",
    price: "24 €",
    hint: "per year, cancel anytime",
    features: ["Everything in Premium", "Incognito mode: private tabs protected by password"],
    highlight: true,
  },
  {
    id: "lifetime",
    name: "Lifetime",
    price: "69 €",
    hint: "one-time payment, lifetime access",
    features: ["All Premium+ features including Incognito", "Pay once, use forever"],
  },
];

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const startCheckout = async (plan: Plan) => {
    setError(null);
    setLoadingPlan(plan);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not signed in");

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout failed");

      // Weiterleitung zur gehosteten Stripe-Checkout-Seite
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoadingPlan(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-brand-dark m-0">LinkLib Premium</h3>
            <p className="text-sm text-slate-500 m-0 mt-1">Ad-free and unlimited — with Premium+ including Incognito mode.</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 text-muted hover:bg-slate-200 transition-colors text-sm"
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          {PLANS.map((plan) => (
            <button
              key={plan.id}
              onClick={() => startCheckout(plan.id)}
              disabled={loadingPlan !== null}
              className={`flex items-center justify-between gap-4 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md disabled:opacity-60 ${
                plan.highlight ? "border-primary bg-primary/5" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="font-bold text-brand-dark flex items-center gap-2">
                  {plan.name}
                  {plan.highlight && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-white bg-primary rounded-full px-2 py-0.5">
                      Most Popular
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">{plan.hint}</div>
                <ul className="m-0 mt-1.5 p-0 list-none flex flex-col gap-0.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="font-bold text-primary whitespace-nowrap">
                {loadingPlan === plan.id ? "Loading…" : plan.price}
              </div>
            </button>
          ))}

          {error && <p className="text-sm text-danger m-0">{error}</p>}

          <p className="text-[11px] text-slate-400 m-0 mt-1 text-center leading-relaxed">
            Secure payment via Stripe · Subscriptions can be canceled anytime
            <br />
            By purchasing, you accept the{" "}
            <a href="/agb" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">Terms & Conditions</a>{" "}
            and explicitly request immediate activation of Premium features before the withdrawal period ends. You acknowledge that your{" "}
            <a href="/widerruf" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary">right of withdrawal</a>{" "}
            may expire in accordance with applicable law.
          </p>
        </div>
      </div>
    </div>
  );
}
