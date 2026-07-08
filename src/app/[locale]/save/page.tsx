"use client";

/**
 * "Auf LinkLib speichern"-Popup.
 *
 * Wird vom einbettbaren Save-Button (public/save-button.js) bzw. vom
 * Bookmarklet als kleines Popup-Fenster geöffnet:
 *   /save?url=<Seiten-URL>&title=<Seitentitel>
 *
 * Ablauf: Session prüfen → Ziel-Sektion wählen (bzw. automatisch "Inbox"
 * anlegen) → Link speichern → Metadaten nachladen → Fenster schließt sich.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { localeFromPathname, localizePath } from "@/lib/locale";

// Gleiche Kürzungslogik wie in der Haupt-App, damit Beschreibungen
// unabhängig vom Eingangsweg identisch aussehen.
const DESCRIPTION_MAX_LENGTH = 220;
function truncateDescription(text?: string | null): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= DESCRIPTION_MAX_LENGTH) return trimmed;
  const cut = trimmed.slice(0, DESCRIPTION_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

// Merker für das zuletzt gewählte Speicherziel, damit wiederholtes
// Speichern (z. B. mehrere Videos hintereinander) mit einem Klick klappt.
const TARGET_STORAGE_KEY = "linklib.saveTargetSectionId";

type TargetOption = { sectionId: string; label: string };

type Status = "init" | "login" | "ready" | "saving" | "done" | "error";

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function SaveWidget() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const isEn = locale === "en";
  const searchParams = useSearchParams();
  const paramUrl = searchParams.get("url")?.trim() || "";
  const paramTitle = searchParams.get("title")?.trim() || "";

  const [status, setStatus] = useState<Status>("init");
  const [errorMessage, setErrorMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [options, setOptions] = useState<TargetOption[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  // Free-Limit (30 normale Links, global pro Account): der Save-Popup-Flow kann
  // ohnehin nur in nicht-privaten Reitern speichern, daher zählt nur das Normal-Limit.
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [normalLinkCount, setNormalLinkCount] = useState(0);
  const NORMAL_LINK_LIMIT = 30;

  // Login-Formular (falls der Nutzer im Popup noch nicht angemeldet ist)
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Die zu speichernde URL: aus dem Query-Parameter oder manuell eingegeben
  const effectiveUrl = paramUrl || manualUrl.trim();

  // Ziel-Sektionen laden: alle Sektionen aus nicht-privaten Reitern.
  // Private (Inkognito-)Reiter bleiben außen vor, da das Popup bewusst
  // keine Passwort-Abfrage für den Inkognito-Modus enthält.
  const loadTargets = useCallback(async () => {
    const [{ data: tabsData }, { data: sectionsData }, { data: linksData }, { data: sessionData }] = await Promise.all([
      supabase.from("tabs").select("id, name, is_private").order("position", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true }),
      supabase.from("sections").select("id, name, parent_id, tab_id").order("created_at", { ascending: true }),
      supabase.from("links").select("id, section_id"),
      supabase.auth.getSession(),
    ]);

    const tabs = tabsData || [];
    const sections = sectionsData || [];
    const publicTabs = tabs.filter((t) => !t.is_private);
    const firstTabId = publicTabs[0]?.id ?? null;

    const opts: TargetOption[] = [];
    const publicSectionIds = new Set<string>();
    for (const tab of publicTabs) {
      // Sektionen ohne tab_id gehören historisch zum ersten Reiter
      const tabSections = sections.filter(
        (s) => s.tab_id === tab.id || (!s.tab_id && tab.id === firstTabId)
      );
      for (const parent of tabSections.filter((s) => !s.parent_id)) {
        opts.push({ sectionId: parent.id, label: `${tab.name} / ${parent.name}` });
        publicSectionIds.add(parent.id);
        for (const sub of tabSections.filter((s) => s.parent_id === parent.id)) {
          opts.push({ sectionId: sub.id, label: `${tab.name} / ${parent.name} / ${sub.name}` });
          publicSectionIds.add(sub.id);
        }
      }
    }
    setNormalLinkCount((linksData || []).filter((l) => publicSectionIds.has(l.section_id)).length);

    if (sessionData.session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("premium_plan, referral_premium_until")
        .eq("id", sessionData.session.user.id)
        .maybeSingle();
      const referralActive = !!profile?.referral_premium_until && new Date(profile.referral_premium_until) > new Date();
      setIsPremiumUser(!!profile?.premium_plan || referralActive);
    }

    setOptions(opts);
    const remembered = localStorage.getItem(TARGET_STORAGE_KEY);
    const fallback = opts[0]?.sectionId || "";
    setSelectedSectionId(
      remembered && opts.some((o) => o.sectionId === remembered) ? remembered : fallback
    );
    setStatus("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) loadTargets();
      else setStatus("login");
    });

    // Fängt den Rücksprung aus dem OAuth-Flow im selben Popup ab
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) loadTargets();
    });
    return () => subscription.unsubscribe();
  }, [loadTargets]);

  // Falls noch keine Sektion existiert, beim Speichern automatisch
  // (Reiter +) Sektion "Inbox" anlegen – so funktioniert der Button auch
  // für frische Accounts ohne eingerichtete Struktur.
  const ensureTargetSection = async (userId: string): Promise<string> => {
    if (selectedSectionId) return selectedSectionId;

    const { data: tabsData } = await supabase
      .from("tabs")
      .select("id, is_private")
      .order("created_at", { ascending: true });
    let tabId = (tabsData || []).find((t) => !t.is_private)?.id;

    if (!tabId) {
      const { data: newTab, error: tabError } = await supabase
        .from("tabs")
        .insert([{ name: isEn ? "Home" : "Startseite", user_id: userId }])
        .select();
      if (tabError || !newTab?.length) throw new Error(isEn ? "Tab could not be created." : "Reiter konnte nicht angelegt werden.");
      tabId = newTab[0].id;
    }

    const { data: newSection, error: sectionError } = await supabase
      .from("sections")
      .insert([{ name: "Inbox", user_id: userId, parent_id: null, tab_id: tabId }])
      .select();
    if (sectionError || !newSection?.length) throw new Error(isEn ? "Section could not be created." : "Sektion konnte nicht angelegt werden.");
    return newSection[0].id;
  };

  const handleSave = async () => {
    const rawInput = effectiveUrl;
    const fullUrl = /^https?:\/\//i.test(rawInput) ? rawInput : `https://${rawInput}`;
    if (!isValidHttpUrl(fullUrl)) {
      setErrorMessage(isEn ? "This is not a valid web address." : "Das ist keine gültige Web-Adresse.");
      setStatus("error");
      return;
    }

    if (!isPremiumUser && normalLinkCount >= NORMAL_LINK_LIMIT) {
      setErrorMessage(
        isEn
          ? "You've reached the free limit of 30 links. Upgrade to Premium in the main app for unlimited links."
          : "Du hast dein kostenloses Limit von 30 Links erreicht. Hol dir in der Hauptapp Premium für unbegrenzte Links."
      );
      setStatus("error");
      return;
    }

    setStatus("saving");
    setErrorMessage("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setStatus("login");
        return;
      }
      const userId = sessionData.session.user.id;
      const sectionId = await ensureTargetSection(userId);

      let domain = fullUrl;
      try { domain = new URL(fullUrl).hostname.replace(/^www\./, ""); } catch {}
      const initial = domain.charAt(0).toUpperCase();

      // Insert wie in der Haupt-App: erst mit Platzhaltern speichern …
      const { data: insertedData, error } = await supabase.from("links").insert([{
        section_id: sectionId,
        user_id: userId,
        url: fullUrl,
        title: paramTitle || domain,
        description: isEn ? "Loading metadata..." : "Lade Metadaten...",
        domain,
        initial,
      }]).select();
      if (error || !insertedData?.length) {
        if (error?.message?.includes("LINK_LIMIT_REACHED")) {
          throw new Error(
            isEn
              ? "You've reached the free limit of 30 links. Upgrade to Premium in the main app for unlimited links."
              : "Du hast dein kostenloses Limit von 30 Links erreicht. Hol dir in der Hauptapp Premium für unbegrenzte Links."
          );
        }
        throw new Error(error?.message || (isEn ? "The link could not be saved." : "Der Link konnte nicht gespeichert werden."));
      }

      localStorage.setItem(TARGET_STORAGE_KEY, sectionId);
      const linkId = insertedData[0].id;

      // … dann Titel/Beschreibung/Bild über die Metadata-API nachziehen
      try {
        const res = await fetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`, {
          headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
        });
        if (!res.ok) throw new Error("API Failure");
        const metaData = await res.json();
        await supabase.from("links").update({
          title: metaData.title || paramTitle || domain,
          description: truncateDescription(metaData.description) || fullUrl,
          image: metaData.image || null,
        }).eq("id", linkId);
      } catch {
        await supabase.from("links").update({ description: fullUrl }).eq("id", linkId);
      }

      setStatus("done");
      // Popup nach kurzer Bestätigung automatisch schließen
      setTimeout(() => { try { window.close(); } catch {} }, 1500);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : (isEn ? "Saving failed." : "Speichern fehlgeschlagen."));
      setStatus("error");
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput,
      password: passwordInput,
    });
    if (error) setLoginError((isEn ? "Login failed: " : "Login fehlgeschlagen: ") + error.message);
    // Erfolg wird über onAuthStateChange abgefangen
  };

  const handleOAuthLogin = async (provider: "github" | "google") => {
    // Zurück auf genau diese Save-URL, damit der Speichern-Flow nach dem
    // OAuth-Roundtrip im Popup nahtlos weitergeht.
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (error) setLoginError((isEn ? "Login failed: " : "Login fehlgeschlagen: ") + error.message);
  };

  const inputClass =
    "w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-slate-50/50 focus:bg-white text-brand-dark text-sm";

  let body: React.ReactNode;

  if (status === "init") {
    body = <p className="text-center text-sm text-muted py-8">{isEn ? "One moment ..." : "Einen Moment …"}</p>;
  } else if (status === "login") {
    body = (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted text-center mb-1">
          {isEn ? "Log in to save this link to your library." : "Melde dich an, um den Link in deiner Bibliothek zu speichern."}
        </p>
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder={isEn ? "Email address" : "E-Mail Adresse"}
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            placeholder={isEn ? "Password" : "Passwort"}
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className={inputClass}
          />
          <button type="submit" className="bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary-hover transition-all text-sm">
            {isEn ? "Log in" : "Anmelden"}
          </button>
        </form>
        {loginError && <p className="text-danger text-xs text-center">{loginError}</p>}
        <div className="relative flex items-center my-1">
          <div className="flex-grow border-t border-slate-200/80"></div>
          <span className="shrink-0 px-3 text-slate-400 text-xs font-bold tracking-widest">{isEn ? "OR" : "ODER"}</span>
          <div className="flex-grow border-t border-slate-200/80"></div>
        </div>
        <button
          type="button"
          onClick={() => handleOAuthLogin("github")}
          className="flex items-center justify-center gap-2 bg-[#24292e] text-white p-3 rounded-xl font-semibold hover:bg-[#1b1f23] transition-all text-sm"
        >
          {isEn ? "Continue with GitHub" : "Mit GitHub anmelden"}
        </button>
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-brand-dark p-3 rounded-xl font-semibold hover:bg-slate-50 transition-all text-sm"
        >
          {isEn ? "Continue with Google" : "Mit Google anmelden"}
        </button>
        <p className="text-xs text-slate-400 text-center mt-1">
          {isEn ? "No account yet?" : "Noch kein Konto?"}{" "}
          <a href={localizePath("/", locale)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {isEn ? "Register for free" : "Kostenlos registrieren"}
          </a>
        </p>
      </div>
    );
  } else if (status === "done") {
    body = (
      <div className="text-center py-6">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <h2 className="font-bold text-brand-dark mb-1">{isEn ? "Saved!" : "Gespeichert!"}</h2>
        <p className="text-sm text-muted">{isEn ? "This window closes automatically." : "Dieses Fenster schließt sich automatisch."}</p>
      </div>
    );
  } else {
    // ready | saving | error → Speicher-Formular
    body = (
      <div className="flex flex-col gap-4">
        {paramUrl ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 overflow-hidden">
            {paramTitle && (
              <p className="text-sm font-semibold text-brand-dark truncate m-0 mb-0.5">{paramTitle}</p>
            )}
            <p className="text-xs text-muted truncate m-0" title={paramUrl}>{paramUrl}</p>
          </div>
        ) : (
          <input
            type="url"
            required
            placeholder="https://…"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            className={inputClass}
            autoFocus
          />
        )}

        <label className="flex flex-col gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
          {isEn ? "Save to" : "Speichern in"}
          {options.length > 0 ? (
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className={`${inputClass} font-normal normal-case tracking-normal cursor-pointer`}
            >
              {options.map((o) => (
                <option key={o.sectionId} value={o.sectionId}>{o.label}</option>
              ))}
            </select>
          ) : (
            <span className="font-normal normal-case tracking-normal text-sm text-muted bg-slate-50 border border-slate-200 rounded-xl p-3">
              {isEn ? "New section \"Inbox\" (created automatically)" : "Neue Sektion „Inbox“ (wird automatisch angelegt)"}
            </span>
          )}
        </label>

        {status === "error" && errorMessage && (
          <p className="text-danger text-xs text-center m-0">{errorMessage}</p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving" || !effectiveUrl}
          className="bg-primary text-white p-3.5 rounded-xl font-bold hover:bg-primary-hover active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? (isEn ? "Saving ..." : "Speichere …") : (isEn ? "Save link" : "Link speichern")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8 font-sans text-brand-dark">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center mb-5">
          <img src="/Wordmark.svg" alt="LinkLib" className="h-8 w-auto" />
        </div>
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-slate-100">
          {body}
        </div>
      </div>
    </div>
  );
}

export default function SavePage() {
  // useSearchParams erfordert im App Router eine Suspense-Boundary
  return (
    <Suspense fallback={null}>
      <SaveWidget />
    </Suspense>
  );
}
