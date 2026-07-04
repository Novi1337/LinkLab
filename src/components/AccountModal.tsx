"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, ExternalLink, Lock, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AccountModalProps {
  isOpen: boolean;
  userEmail: string;
  onClose: () => void;
  locale?: "de" | "en";
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
  premium: "Premium – Jahres-Abo",
  premium_plus: "Premium+ – Jahres-Abo",
  lifetime: "Premium – Lifetime",
};

const MAX_NICKNAME_LENGTH = 32;

function formatDate(iso: string, locale: "de" | "en"): string {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

// Holt das aktuelle Access-Token, damit die Account-APIs den Nutzer verifizieren können
async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token ?? ""}` };
}

export function AccountModal({ isOpen, userEmail, onClose, locale = "de", onSubscriptionChanged }: AccountModalProps) {
  const isEn = locale === "en";
  // Abo-Zustand (subLoading startet true, da beim Mount sofort geladen wird)
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Nickname für Share-Label (z. B. "Geteilt von Max" statt voller E-Mail)
  const [nickname, setNickname] = useState("");
  const [nicknameLoading, setNicknameLoading] = useState(true);
  const [nicknameBusy, setNicknameBusy] = useState(false);
  const [nicknameMessage, setNicknameMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      setSubError(isEn ? "Subscription details could not be loaded." : "Abo-Details konnten nicht geladen werden.");
    } finally {
      setSubLoading(false);
    }
  }, [isEn]);

  const loadNickname = useCallback(async () => {
    try {
      const res = await fetch("/api/account/nickname", { headers: await authHeader() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "load_failed");
      setNickname(data?.nickname || "");
      setNicknameMessage(null);
    } catch (err) {
      setNicknameMessage({
        type: "error",
        text:
          err instanceof Error && err.message && err.message !== "load_failed"
            ? err.message
            : (isEn ? "Nickname could not be loaded." : "Nickname konnte nicht geladen werden."),
      });
    } finally {
      setNicknameLoading(false);
    }
  }, [isEn]);

  useEffect(() => {
    if (!isOpen) return;
    // Daten beim Öffnen laden - via setTimeout(0) entkoppelt, damit kein setState
    // synchron im Effect-Body läuft (react-hooks/set-state-in-effect).
    const t = setTimeout(() => {
      setSubLoading(true);
      setNicknameLoading(true);
      loadSubscription();
      loadNickname();
      supabase.auth.getUser().then(({ data }) => {
        setHasPasswordLogin(Boolean(data.user?.identities?.some((i) => i.provider === "email")));
      });
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, loadSubscription, loadNickname]);

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
      setSubError(action === "cancel"
        ? (isEn ? "Cancellation failed. Please try again." : "Kündigung fehlgeschlagen. Bitte versuche es erneut.")
        : (isEn ? "Reactivation failed. Please try again." : "Reaktivierung fehlgeschlagen. Bitte versuche es erneut."));
    } finally {
      setActionBusy(false);
    }
  };

  // Öffnet das Stripe-Billing-Portal für Rechnungen und Zahlungsmethoden
  const openBillingPortal = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST", headers: await authHeader() });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) window.location.assign(data.url);
    else setSubError(isEn ? "Payment portal could not be opened." : "Zahlungsportal konnte nicht geöffnet werden.");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 6) {
      return setPasswordMessage({ type: "error", text: isEn ? "Password must be at least 6 characters long." : "Das Passwort muss mindestens 6 Zeichen lang sein." });
    }
    if (newPassword !== repeatPassword) {
      return setPasswordMessage({ type: "error", text: isEn ? "Passwords do not match." : "Die Passwörter stimmen nicht überein." });
    }
    setPasswordBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordBusy(false);
    if (error) {
      setPasswordMessage({ type: "error", text: (isEn ? "Could not change password: " : "Passwort konnte nicht geändert werden: ") + error.message });
    } else {
      setPasswordMessage({ type: "success", text: isEn ? "Password changed successfully." : "Passwort erfolgreich geändert." });
      setNewPassword("");
      setRepeatPassword("");
    }
  };

  const saveNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNicknameMessage(null);

    const trimmed = nickname.replace(/\s+/g, " ").trim();
    if (trimmed.length > MAX_NICKNAME_LENGTH) {
      setNicknameMessage({
        type: "error",
        text: isEn
          ? `Nickname may contain up to ${MAX_NICKNAME_LENGTH} characters.`
          : `Der Nickname darf maximal ${MAX_NICKNAME_LENGTH} Zeichen enthalten.`,
      });
      return;
    }

    setNicknameBusy(true);
    try {
      const res = await fetch("/api/account/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeader()) },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "save_failed");
      setNickname(data?.nickname || "");
      setNicknameMessage({
        type: "success",
        text: isEn ? "Nickname saved." : "Nickname gespeichert.",
      });
    } catch (err) {
      setNicknameMessage({
        type: "error",
        text:
          err instanceof Error && err.message
            ? err.message
            : (isEn ? "Nickname could not be saved." : "Nickname konnte nicht gespeichert werden."),
      });
    } finally {
      setNicknameBusy(false);
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
      setDeleteError(isEn ? "Account could not be deleted. Please try again." : "Account konnte nicht gelöscht werden. Bitte versuche es erneut.");
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
            <h3 className="text-lg font-bold text-brand-dark m-0">{isEn ? "My account" : "Mein Konto"}</h3>
            <p className="text-sm text-slate-500 m-0 mt-0.5">{userEmail}</p>
          </div>
          <button
            onClick={onClose}
            aria-label={isEn ? "Close" : "Schließen"}
            className="p-2 rounded-lg text-slate-400 hover:text-brand-dark hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6">
          {/* ---- Nickname für geteilte Inhalte ---- */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-brand-dark uppercase tracking-wide mb-3">
              {isEn ? "Sharing name" : "Sharing-Name"}
            </h4>
            {nicknameLoading ? (
              <p className="text-sm text-slate-500 m-0">{isEn ? "Loading ..." : "Lade ..."}</p>
            ) : (
              <form onSubmit={saveNickname} className="flex flex-col gap-3">
                <p className="text-sm text-slate-500 m-0">
                  {isEn
                    ? "This name is shown in shared tabs and sections (instead of your email)."
                    : "Dieser Name wird in geteilten Reitern und Abschnitten angezeigt (statt deiner E-Mail)."}
                </p>
                <input
                  type="text"
                  placeholder={isEn ? "for example Max" : "z. B. Max"}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={MAX_NICKNAME_LENGTH}
                  className="p-3 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-slate-50/50 focus:bg-white text-brand-dark text-sm"
                />
                <p className="text-xs text-slate-400 m-0">
                  {nickname.trim().length}/{MAX_NICKNAME_LENGTH}
                </p>
                {nicknameMessage && (
                  <p className={`text-sm m-0 ${nicknameMessage.type === "success" ? "text-emerald-600" : "text-danger"}`}>
                    {nicknameMessage.text}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={nicknameBusy}
                  className="self-start px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
                >
                  {nicknameBusy ? (isEn ? "Saving ..." : "Wird gespeichert ...") : (isEn ? "Save name" : "Namen speichern")}
                </button>
              </form>
            )}
          </section>

          {/* ---- Abo & Zahlungsplan ---- */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-brand-dark uppercase tracking-wide mb-3">
              <CreditCard className="w-4 h-4 text-primary" /> {isEn ? "Subscription & billing" : "Abo & Zahlungsplan"}
            </h4>

            {subLoading ? (
              <p className="text-sm text-slate-500">{isEn ? "Loading subscription details ..." : "Lade Abo-Details …"}</p>
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
                      {subscription.cancelAtPeriodEnd ? (isEn ? "Canceled" : "Gekündigt") : (isEn ? "Active" : "Aktiv")}
                    </span>
                  )}
                </div>

                {isLifetime && (
                  <p className="text-sm text-slate-600 m-0">
                    {isEn ? "Lifetime access, no further payments required." : "Lebenslanger Zugang – keine weiteren Zahlungen nötig."}
                    {subscription.premiumSince && <> {isEn ? "Premium since" : "Premium seit"} {formatDate(subscription.premiumSince, locale)}.</>}
                  </p>
                )}

                {hasActiveSubscription && subscription.currentPeriodEnd && (
                  <div className="text-sm text-slate-600 flex flex-col gap-1">
                    {subscription.cancelAtPeriodEnd ? (
                      <span>
                        {isEn ? "Your subscription ends on" : "Dein Abo endet am"} <strong className="text-brand-dark">{formatDate(subscription.currentPeriodEnd, locale)}</strong>{" "}
                        ({isEn ? `${daysUntil(subscription.currentPeriodEnd)} days left` : `noch ${daysUntil(subscription.currentPeriodEnd)} Tage`}). {isEn ? "Until then, you keep full Premium access." : "Bis dahin behältst du vollen Premium-Zugang."}
                      </span>
                    ) : (
                      <span>
                        {isEn ? "Renews automatically on" : "Verlängert sich automatisch am"} <strong className="text-brand-dark">{formatDate(subscription.currentPeriodEnd, locale)}</strong>{" "}
                        ({isEn ? `in ${daysUntil(subscription.currentPeriodEnd)} days` : `in ${daysUntil(subscription.currentPeriodEnd)} Tagen`}).
                      </span>
                    )}
                  </div>
                )}

                {!subscription.plan && (
                  <p className="text-sm text-slate-600 m-0">{isEn ? "You are currently on the free plan." : "Du nutzt aktuell den kostenlosen Plan."}</p>
                )}

                {/* Kündigen / Reaktivieren */}
                {hasActiveSubscription && !subscription.cancelAtPeriodEnd && (
                  confirmCancel ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex flex-col gap-2">
                      <span>{isEn ? "Cancel subscription now? It stays active until the end of the paid period." : "Abo wirklich kündigen? Es bleibt bis zum Ende des bezahlten Zeitraums aktiv."}</span>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setConfirmCancel(false)}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          {isEn ? "Keep it" : "Behalten"}
                        </button>
                        <button
                          onClick={() => changeSubscription("cancel")}
                          disabled={actionBusy}
                          className="px-3 py-1.5 text-sm font-bold text-white bg-danger hover:opacity-90 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionBusy ? (isEn ? "Canceling ..." : "Wird gekündigt …") : (isEn ? "Cancel now" : "Jetzt kündigen")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="self-start text-sm font-semibold text-danger hover:underline"
                    >
                      {isEn ? "Cancel subscription" : "Abo kündigen"}
                    </button>
                  )
                )}
                {hasActiveSubscription && subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={() => changeSubscription("resume")}
                    disabled={actionBusy}
                    className="self-start px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionBusy ? (isEn ? "Reactivating ..." : "Wird reaktiviert …") : (isEn ? "Undo cancellation" : "Kündigung zurücknehmen")}
                  </button>
                )}

                {/* Rechnungen & Zahlungsmethode laufen über das gehostete Stripe-Portal */}
                {subscription.plan && (
                  <button
                    onClick={openBillingPortal}
                    className="self-start flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                  >
                    {isEn ? "Invoices & payment method" : "Rechnungen & Zahlungsmethode"} <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : null}

            {subError && <p className="text-sm text-danger mt-2">{subError}</p>}
          </section>

          {/* ---- Passwort ändern ---- */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-brand-dark uppercase tracking-wide mb-3">
              <Lock className="w-4 h-4 text-primary" /> {isEn ? "Change password" : "Passwort ändern"}
            </h4>
            {hasPasswordLogin ? (
              <form onSubmit={changePassword} className="flex flex-col gap-3">
                <input
                  type="password"
                  placeholder={isEn ? "New password" : "Neues Passwort"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="p-3 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-slate-50/50 focus:bg-white text-brand-dark text-sm"
                />
                <input
                  type="password"
                  placeholder={isEn ? "Repeat new password" : "Neues Passwort wiederholen"}
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
                  {passwordBusy ? (isEn ? "Saving ..." : "Wird gespeichert …") : (isEn ? "Save password" : "Passwort speichern")}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500 m-0">
                {isEn
                  ? "You sign in via an external provider (for example Google or GitHub), so your password is managed there."
                  : "Du meldest dich über einen externen Anbieter (z. B. Google oder GitHub) an – dein Passwort verwaltest du direkt dort."}
              </p>
            )}
          </section>

          {/* ---- Gefahrenzone: Account löschen ---- */}
          <section>
            <h4 className="flex items-center gap-2 text-sm font-bold text-danger uppercase tracking-wide mb-3">
              <Trash2 className="w-4 h-4" /> {isEn ? "Delete account" : "Account löschen"}
            </h4>
            {confirmDelete ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
                <p className="text-sm text-red-800 m-0">
                  <strong>{isEn ? "Final warning:" : "Letzte Warnung:"}</strong> {isEn
                    ? "Your account, all saved links, sections, and tabs, as well as any active subscription, will be deleted immediately and permanently."
                    : "Dein Account, alle gespeicherten Links, Sektionen und Reiter sowie ein eventuell laufendes Abo werden sofort und unwiderruflich gelöscht."}
                </p>
                {deleteError && <p className="text-sm text-danger m-0 font-semibold">{deleteError}</p>}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleteBusy}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    {isEn ? "Cancel" : "Abbrechen"}
                  </button>
                  <button
                    onClick={deleteAccount}
                    disabled={deleteBusy}
                    className="px-4 py-1.5 text-sm font-bold text-white bg-danger hover:opacity-90 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {deleteBusy ? (isEn ? "Deleting ..." : "Wird gelöscht …") : (isEn ? "Delete permanently" : "Endgültig löschen")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="px-4 py-2 text-sm font-bold text-danger border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
              >
                {isEn ? "Delete account permanently" : "Account unwiderruflich löschen"}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
