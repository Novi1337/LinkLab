"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, Lock, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AccountModalProps {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  /** Wird nach Kündigung/Reaktivierung aufgerufen, damit die App den Premium-Status neu lädt */
  onSubscriptionChanged?: () => void;
}

type SubscriptionInfo = {
  plan: "premium" | "premium_plus" | "lifetime" | null;
  premiumSince: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

const PLAN_LABELS: Record<string, string> = {
  premium: "Premium - Yearly Plan",
  premium_plus: "Premium+ - Yearly Plan",
  lifetime: "Premium - Lifetime Access",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

// Holt das aktuelle Access-Token, damit die Account-APIs den Nutzer verifizieren können
async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
}

export function AccountModal({ isOpen, userEmail, onClose, onSubscriptionChanged }: AccountModalProps) {
  // Abo-Zustand (subLoading startet true, da beim Mount sofort geladen wird)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Passwort-Zustand (nur für Nutzer mit Email/Passwort-Login relevant)
  const [hasPasswordLogin, setHasPasswordLogin] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Account-Löschung
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadSubscription = useCallback(async () => {
    // Kein synchrones setState vor dem ersten await - vermeidet Render-Kaskaden im Effect
    try {
      const res = await fetch("/api/account/subscription", { headers: await authHeader() });
      if (!res.ok) throw new Error();
      setSubscription(await res.json());
      setSubError("");
    } catch {
      setSubError("Subscription details could not be loaded.");
    } finally {
      setSubLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // Daten beim Öffnen laden - via setTimeout(0) entkoppelt, damit kein setState
    // synchron im Effect-Body läuft (react-hooks/set-state-in-effect).
    const t = setTimeout(() => {
      loadSubscription();
      supabase.auth.getUser().then(({ data }) => {
        setHasPasswordLogin(Boolean(data.user?.identities?.some((i) => i.provider === "email")));
      });
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, loadSubscription]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Kündigung zum Periodenende bzw. Reaktivierung eines gekündigten Abos
  const changeSubscription = async (action: "cancel" | "resume") => {
    setActionBusy(true);
    setSubError("");
    try {
      const res = await fetch("/api/account/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setSubscription(await res.json());
      setConfirmCancel(false);
      onSubscriptionChanged?.();
    } catch {
      setSubError(action === "cancel" ? "Cancellation failed. Please try again." : "Reactivation failed. Please try again.");
    } finally {
      setActionBusy(false);
    }
  };

  // Öffnet das Stripe-Billing-Portal für Rechnungen und Zahlungsmethoden
  const openBillingPortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST", headers: await authHeader() });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) window.location.assign(data.url);
    else setSubError("Billing portal could not be opened.");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      return setPasswordMessage({ type: "error", text: "Your password must be at least 6 characters long." });
    }
    if (newPassword !== repeatPassword) {
      return setPasswordMessage({ type: "error", text: "Passwords do not match." });
    }
    setPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) {
      setPasswordMessage({ type: "error", text: "Password could not be updated: " + error.message });
    } else {
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setNewPassword("");
      setRepeatPassword("");
    }
  };

  const deleteAccount = async () => {
    setDeleteBusy(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/account/delete", { method: "POST", headers: await authHeader() });
      if (!res.ok) throw new Error();
      // Lokale Session beenden - der Auth-Listener in page.tsx setzt die App zurück
      await supabase.auth.signOut();
      onClose();
    } catch {
      setDeleteError("Account could not be deleted. Please try again.");
      setDeleteBusy(false);
    }
  };

  if (!isOpen) return null;

  const isLifetime = subscription?.plan === "lifetime";
  const hasActiveSubscription = Boolean(subscription?.plan && !isLifetime && subscription?.currentPeriodEnd);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kopfbereich */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-brand-dark m-0">My Account</h3>
            <p className="text-sm text-slate-500 m-0 mt-0.5">{userEmail}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg text-slate-400 hover:text-brand-dark hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* ---- Abo & Zahlungsplan ---- */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-brand-dark uppercase tracking-wide mb-3">
              <CreditCard className="w-4 h-4 text-primary" /> Subscription &amp; Billing
            </h4>

            {subLoading ? (
              <p className="text-sm text-slate-500">Loading subscription details…</p>
            ) : subscription ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-brand-dark">
                    {subscription.plan ? PLAN_LABELS[subscription.plan] : "Free"}
                  </span>
                  {subscription.plan && (
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        subscription.cancelAtPeriodEnd
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {subscription.cancelAtPeriodEnd ? "Canceled" : "Active"}
                    </span>
                  )}
                </div>

                {isLifetime && (
                  <p className="text-sm text-slate-600 m-0">
                    Lifetime access — no further payments required.
                    {subscription.premiumSince && <> Premium since {formatDate(subscription.premiumSince)}.</>}
                  </p>
                )}

                {hasActiveSubscription && subscription.currentPeriodEnd && (
                  <div className="text-sm text-slate-600 flex flex-col gap-1">
                    {subscription.cancelAtPeriodEnd ? (
                      <span>
                        Your subscription ends on <strong className="text-brand-dark">{formatDate(subscription.currentPeriodEnd)}</strong>{" "}
                        ({daysUntil(subscription.currentPeriodEnd)} days remaining). Your full Premium access remains active until then.
                      </span>
                    ) : (
                      <span>
                        Renews automatically on <strong className="text-brand-dark">{formatDate(subscription.currentPeriodEnd)}</strong>{" "}
                        (in {daysUntil(subscription.currentPeriodEnd)} days).
                      </span>
                    )}
                  </div>
                )}

                {!subscription.plan && (
                  <p className="text-sm text-slate-600 m-0">You are currently on the Free plan.</p>
                )}

                {/* Kündigen / Reaktivieren */}
                {hasActiveSubscription && !subscription.cancelAtPeriodEnd && (
                  confirmCancel ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex flex-col gap-2">
                      <span>Cancel your subscription? It will remain active until the end of the paid term.</span>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setConfirmCancel(false)}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Keep Plan
                        </button>
                        <button
                          onClick={() => changeSubscription("cancel")}
                          disabled={actionBusy}
                          className="px-3 py-1.5 text-sm font-bold text-white bg-danger hover:opacity-90 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionBusy ? "Cancelling…" : "Cancel Now"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="self-start text-sm font-semibold text-danger hover:underline"
                    >
                      Cancel Subscription
                    </button>
                  )
                )}
                {hasActiveSubscription && subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={() => changeSubscription("resume")}
                    disabled={actionBusy}
                    className="self-start px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionBusy ? "Reactivating…" : "Undo Cancellation"}
                  </button>
                )}

                {/* Rechnungen & Zahlungsmethode laufen über das gehostete Stripe-Portal */}
                {subscription.plan && (
                  <button
                    onClick={openBillingPortal}
                    className="self-start flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    Invoices &amp; Payment Method <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : null}

            {subError && <p className="text-sm text-danger mt-2">{subError}</p>}
          </section>

          {/* ---- Passwort ändern ---- */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-brand-dark uppercase tracking-wide mb-3">
              <Lock className="w-4 h-4 text-primary" /> Change Password
            </h4>
            {hasPasswordLogin ? (
              <form onSubmit={changePassword} className="flex flex-col gap-3">
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="p-3 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-slate-50/50 focus:bg-white text-brand-dark text-sm"
                />
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  autoComplete="new-password"
                  className="p-3 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-slate-50/50 focus:bg-white text-brand-dark text-sm"
                />
                {passwordMessage && (
                  <p className={`text-sm m-0 ${passwordMessage.type === "success" ? "text-emerald-600" : "text-danger"}`}>
                    {passwordMessage.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={passwordBusy || !newPassword}
                  className="self-start px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
                >
                  {passwordBusy ? "Saving…" : "Save Password"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500 m-0">
                You sign in through an external provider (for example Google or GitHub), so your password is managed there.
              </p>
            )}
          </section>

          {/* ---- Gefahrenzone: Account löschen ---- */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-danger uppercase tracking-wide mb-3">
              <Trash2 className="w-4 h-4" /> Delete Account
            </h4>
            {confirmDelete ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
                <p className="text-sm text-red-800 m-0">
                  <strong>Final warning:</strong> Your account, all saved links, sections, and tabs, as well as any active subscription,
                  will be deleted immediately and permanently.
                </p>
                {deleteError && <p className="text-sm text-danger m-0 font-semibold">{deleteError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleteBusy}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deleteBusy}
                    className="px-4 py-1.5 text-sm font-bold text-white bg-danger hover:opacity-90 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleteBusy ? "Deleting…" : "Delete Permanently"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 text-sm font-bold text-danger border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete Account Permanently
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
