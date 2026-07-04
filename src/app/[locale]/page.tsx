"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { ReactSortable } from "react-sortablejs";
import { supabase } from "@/lib/supabaseClient";
import { AdBanner } from "@/components/AdBanner";
import { Edit2, Eye, EyeOff, Gift, Share2 } from "lucide-react";
import { PromptModal } from "@/components/PromptModal";
import { ConfirmModal } from "@/components/ConfirmModal";
import { UpgradeModal } from "@/components/UpgradeModal";
import { IncognitoPasswordModal } from "@/components/IncognitoPasswordModal";
import { ReferralModal } from "@/components/ReferralModal";
import { AccountModal } from "@/components/AccountModal";
import { LegalFooter } from "@/components/LegalFooter";
import { LandingSections } from "@/components/LandingSections";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { isOwnerClientUser } from "@/lib/ownerClient";
import { localeFromPathname, type AppLocale } from "@/lib/locale";

type Link = {
  id: string;
  url: string;
  title: string;
  description: string;
  image: string | null;
  initial: string;
  domain: string;
};

type Section = {
  id: string;
  name: string;
  parent_id: string | null;
  tab_id: string | null;
  color: string | null;
  shared_from_label?: string | null;
  links: Link[];
  subSections: Section[];
};

type Tab = {
  id: string;
  name: string;
  color?: string | null;
  is_private?: boolean;
  shared_from_label?: string | null;
};

// Kuratierte Akzentfarben, mit denen Nutzer einzelne Tabs/Sektionen markieren können,
// um sie auf einen Blick unterscheiden zu können (unabhängig vom blauen Standard-Primary-Ton).
const COLOR_PALETTE: { name: string; value: string }[] = [
  { name: "Rot", value: "#dc2626" },
  { name: "Orange", value: "#ea580c" },
  { name: "Amber", value: "#ca8a04" },
  { name: "Grün", value: "#16a34a" },
  { name: "Türkis", value: "#0f766e" },
  { name: "Blau", value: "#2563eb" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violett", value: "#7c3aed" },
  { name: "Pink", value: "#db2777" },
  { name: "Slate", value: "#334155" },
];

// Kürzt eine Beschreibung auf eine sinnvolle Länge, ohne mitten im Wort abzuschneiden,
// damit der Nutzer noch erkennen kann, worum es im gespeicherten Link geht.
const DESCRIPTION_MAX_LENGTH = 220;
function truncateDescription(text?: string | null): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.length <= DESCRIPTION_MAX_LENGTH) return trimmed;
  const cut = trimmed.slice(0, DESCRIPTION_MAX_LENGTH);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

// SHA-256-Hash (hex) für das Inkognito-Passwort. Das Klartext-Passwort verlässt
// nie den Browser - in der DB liegt nur der mit der User-ID gesalzene Hash.
async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function Home() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname) as AppLocale;
  const isEn = locale === "en";

  const t = {
    addTabPrompt: isEn ? "Name of the new tab:" : "Name des neuen Reiters:",
    renameTabPrompt: isEn ? "Rename tab:" : "Reiter umbenennen:",
    deleteTabTitle: isEn ? "Delete tab?" : "Reiter löschen?",
    deleteTabMessage: isEn
      ? "This tab and all contained sections and links will be deleted permanently."
      : "Dieser Reiter inklusive aller beinhalteten Sektionen und Links wird unwiderruflich gelöscht.",
    premiumFeatureTitle: isEn ? "Premium+ feature" : "Premium+-Funktion",
    premiumFeatureMessage: isEn
      ? "Private tabs with Incognito mode are available with Premium+ (24 EUR/year) or Lifetime access (69 EUR one-time)."
      : "Private Reiter mit Inkognito-Modus gibt es im Premium+-Abo (24 €/Jahr) oder mit Lifetime-Zugang (69 € einmalig).",
    upgrade: isEn ? "Upgrade" : "Upgrade",
    saveFailed: isEn ? "Saving failed" : "Speichern fehlgeschlagen",
    wrongPassword: isEn ? "Incorrect password." : "Falsches Passwort.",
    fillAllFields: isEn ? "Please fill in all fields." : "Bitte fülle alle Felder aus.",
    loginError: isEn ? "Login error: " : "Fehler beim Login: ",
    signupError: isEn ? "Sign-up error: " : "Fehler bei der Registrierung: ",
    signupSuccess: isEn ? "Registration successful!" : "Erfolgreich registriert!",
    githubLoginError: isEn ? "GitHub login error: " : "GitHub Login Fehler: ",
    googleLoginError: isEn ? "Google login error: " : "Google Login Fehler: ",
    addMainSectionPrompt: isEn ? "What should the new main section be called?" : "Wie soll die neue Hauptsektion heißen?",
    addSubSectionPrompt: isEn ? "What should the subsection be called?" : "Wie soll die Untersektion heißen?",
    createSectionError: isEn ? "Error creating section: " : "Fehler beim Erstellen der Sektion: ",
    loadingMetadata: isEn ? "Loading metadata..." : "Lade Metadaten...",
    deleteLinkTitle: isEn ? "Delete link?" : "Link löschen?",
    deleteLinkMessage: isEn ? "This link will be deleted permanently." : "Dieser Link wird unwiderruflich gelöscht.",
    renameSectionPrompt: isEn ? "Rename section:" : "Sektion umbenennen:",
    deleteSectionTitle: isEn ? "Delete section?" : "Sektion löschen?",
    deleteSectionMessage: isEn
      ? "This section including all subsections and links will be deleted permanently."
      : "Diese Sektion inklusive ihrer Untersektionen und Links wird unwiderruflich gelöscht.",
    expand: isEn ? "Expand" : "Aufklappen",
    collapse: isEn ? "Collapse" : "Zuklappen",
    assignColor: isEn ? "Assign color" : "Farbe zuweisen",
    clickToEdit: isEn ? "Click to edit" : "Hier klicken zum Bearbeiten",
    addLink: isEn ? "+ Link" : "+ Link",
    addSubsection: isEn ? "+ Subsection" : "+ Untersektion",
    delete: isEn ? "Delete" : "Löschen",
    addButton: isEn ? "Add" : "Hinzufügen",
    deleteLinkTitleAttr: isEn ? "Delete link" : "Link löschen",
    adLabel: isEn ? "Ad" : "Anzeige",
    heroTitle: isEn ? "Your private cloud link library" : "Deine diskrete Link-Bibliothek in der Cloud",
    heroSubtitle: isEn
      ? "Save bookmarks, organize them in folders, and access them from any device."
      : "Lesezeichen speichern, in Ordnern organisieren und von jedem Gerät abrufen.",
    login: isEn ? "Log in" : "Anmelden",
    register: isEn ? "Sign up" : "Registrieren",
    password: isEn ? "Password" : "Passwort",
    email: isEn ? "Email address" : "E-Mail Adresse",
    startNow: isEn ? "Get started" : "Loslegen",
    createAccount: isEn ? "Create account" : "Konto erstellen",
    or: isEn ? "OR" : "ODER",
    connectGithub: isEn ? "Continue with GitHub" : "Mit GitHub verknüpfen",
    continueGoogle: isEn ? "Continue with Google" : "Mit Google fortfahren",
    noAccount: isEn ? "No account yet?" : "Noch kein Konto?",
    registerFree: isEn ? "Register for free" : "Kostenlos registrieren",
    inviteTitle: isEn ? "Invite friends - get 1 year Premium" : "Freunde einladen - 1 Jahr Premium sichern",
    invite: isEn ? "Invite" : "Einladen",
    ownerTitle: isEn ? "Owner mode: Premium permanently active" : "Owner-Modus: Premium dauerhaft aktiv",
    lifetimeTitle: isEn ? "Lifetime Premium access incl. Incognito" : "Lebenslanger Premium-Zugang inkl. Inkognito",
    managePremiumTitle: isEn ? "Manage Premium subscription" : "Premium-Abo verwalten",
    referralPremiumUntil: isEn ? "Premium via referrals until " : "Premium über Empfehlungsprogramm bis ",
    adFreeTitle: isEn ? "Ad-free with LinkLib Premium" : "Werbefrei mit LinkLib Premium",
    accountTitle: isEn ? "Manage account (subscription, password, deletion)" : "Konto verwalten (Abo, Passwort, Löschung)",
    logout: isEn ? "Log out" : "Logout",
    tabRenameTitle: isEn ? "Double-click to rename" : "Doppelklick zum Umbenennen",
    makePublicTitle: isEn ? "Make tab public" : "Reiter öffentlich machen",
    makePrivateTitle: isEn ? "Make tab private (visible only in Incognito mode)" : "Reiter privat machen (nur im Inkognito-Modus sichtbar)",
    tabDeleteTitle: isEn ? "Delete tab permanently" : "Reiter unwiderruflich löschen",
    createTabTitle: isEn ? "Create new tab" : "Neuen Reiter anlegen",
    endIncognitoTitle: isEn ? "Exit Incognito mode (hide private tabs)" : "Inkognito-Modus beenden (private Reiter ausblenden)",
    enterIncognitoTitle: isEn ? "Incognito mode: show private tabs with password" : "Inkognito-Modus: private Reiter per Passwort einblenden",
    insertSection: isEn ? "Insert section" : "Abschnitt einfügen",
    emptyTitle: isEn ? "Looks pretty empty here!" : "Noch ziemlich leer hier!",
    emptySubtitle: isEn
      ? 'Click "+ Insert section" in the top right to start saving links in this tab.'
      : 'Klicke oben rechts auf "+ Abschnitt einfügen", um mit dem Speichern deiner Links in diesem Reiter zu beginnen.',
  };

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  const [sections, setSections] = useState<Section[]>([]);
  const [newLinkInputs, setNewLinkInputs] = useState<{ [key: string]: string }>({});
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});
  const [activeLinkForm, setActiveLinkForm] = useState<string | null>(null);
  const [colorPickerOpenId, setColorPickerOpenId] = useState<string | null>(null);
  const [tabEditModal, setTabEditModal] = useState<{
    isOpen: boolean;
    tabId: string | null;
    name: string;
    color: string;
  }>({ isOpen: false, tabId: null, name: "", color: COLOR_PALETTE[5].value });

  // Premium: null = noch nicht geladen, sonst der aktive Plan (oder "" = kein Premium).
  // Zusätzlich kann zeitlich begrenztes Premium aus dem Empfehlungsprogramm aktiv sein.
  const [premiumPlan, setPremiumPlan] = useState<string | null>(null);
  const [referralUntil, setReferralUntil] = useState<string | null>(null);
  const [ownerPremium, setOwnerPremium] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const referralPremiumActive = !!referralUntil && new Date(referralUntil) > new Date();
  const isPremium = ownerPremium || !!premiumPlan || referralPremiumActive;
  // Inkognito-Modus ist Premium+ und Lifetime vorbehalten -
  // Basis-Premium und Referral-Premium enthalten ihn NICHT.
  const hasIncognitoAccess = ownerPremium || premiumPlan === "premium_plus" || premiumPlan === "lifetime";

  // Inkognito-Modus (Premium): entsperrt = private Reiter sichtbar.
  // Der Hash des Inkognito-Passworts wird zusammen mit dem Premium-Status geladen.
  const [incognitoUnlocked, setIncognitoUnlocked] = useState(false);
  const [incognitoHash, setIncognitoHash] = useState<string | null>(null);
  const [incognitoModal, setIncognitoModal] = useState<{
    isOpen: boolean;
    mode: "setup" | "unlock";
    error: string | null;
  }>({ isOpen: false, mode: "unlock", error: null });

  const fetchPremiumStatus = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;
    const isOwner = isOwnerClientUser(sessionData.session.user.id, sessionData.session.user.email || null);
    setOwnerPremium(isOwner);
    const { data } = await supabase
      .from("profiles")
      .select("premium_plan, incognito_password_hash, referral_premium_until")
      .eq("id", sessionData.session.user.id)
      .maybeSingle();
    setPremiumPlan(isOwner ? "owner" : (data?.premium_plan || ""));
    setReferralUntil(data?.referral_premium_until || null);
    setIncognitoHash(data?.incognito_password_hash || null);
  }, []);

  // Referral-Link (?ref=CODE): Code lokal merken, damit er nach der Registrierung
  // eingelöst werden kann - auch wenn dazwischen ein OAuth-Redirect liegt.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref && /^[A-Za-z0-9]{4,16}$/.test(ref)) {
      localStorage.setItem("linklib_pending_ref", ref.toUpperCase());
      params.delete("ref");
      const query = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""));
    }
  }, []);

  // Share-Link (?share=TOKEN): Token lokal merken, damit ein Empfänger den
  // Inhalt nach Login/Registrierung automatisch übernehmen kann.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareToken = params.get("share");
    if (shareToken && /^[A-Za-z0-9_-]{12,256}$/.test(shareToken)) {
      localStorage.setItem("linklib_pending_share", shareToken);
      params.delete("share");
      const query = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (query ? `?${query}` : ""));
    }
  }, []);

  // Nach Rückkehr von der Stripe-Checkout-Seite: Status neu laden und URL bereinigen.
  // Kurz verzögert erneut prüfen, da der Webhook minimal später eintreffen kann als der Redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("checkout")) {
      if (params.get("checkout") === "success") {
        // Asynchron laden (kein Direktaufruf im Effect-Body, vermeidet setState-Kaskaden);
        // nach 3s erneut, da der Stripe-Webhook später eintreffen kann als der Redirect.
        const immediate = setTimeout(fetchPremiumStatus, 0);
        const retry = setTimeout(fetchPremiumStatus, 3000);
        window.history.replaceState({}, "", window.location.pathname);
        return () => {
          clearTimeout(immediate);
          clearTimeout(retry);
        };
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchPremiumStatus]);

  // Öffnet das Stripe-Billing-Portal (Abo verwalten/kündigen, Rechnungen)
  const openBillingPortal = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return;
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok && data.url) window.location.assign(data.url);
  };

  useEffect(() => {
    if (!colorPickerOpenId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-color-picker-root]")) {
        setColorPickerOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colorPickerOpenId]);

  const updateTabColor = async (tabId: string, color: string | null) => {
    setColorPickerOpenId(null);
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, color } : t));
    await supabase.from("tabs").update({ color }).eq("id", tabId);
  };

  const updateSectionColor = async (sectionId: string, color: string | null) => {
    setColorPickerOpenId(null);
    setSections(prev => updateSectionInState(prev, sectionId, s => ({ ...s, color })));
    await supabase.from("sections").update({ color }).eq("id", sectionId);
  };

  // Kleines Popover mit Farbmustern zum Zuweisen einer Akzentfarbe an einen Tab/eine Sektion
  const renderColorPicker = (currentColor: string | null | undefined, onPick: (color: string | null) => void) => (
    <div data-color-picker-root className="absolute top-full left-0 mt-1 z-30 bg-white rounded-xl shadow-lg border border-slate-200 p-2 grid grid-cols-4 gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => onPick(null)}
        title="Keine Farbe"
        className="w-5 h-5 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[10px] text-slate-400 hover:border-slate-400"
      >
        ✕
      </button>
      {COLOR_PALETTE.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onPick(c.value)}
          title={c.name}
          className="w-5 h-5 rounded-full border transition-transform hover:scale-110"
          style={{ backgroundColor: c.value, borderColor: currentColor === c.value ? "#23466b" : "transparent" }}
        />
      ))}
    </div>
  );

  const [promptData, setPromptData] = useState<{
    isOpen: boolean;
    title: string;
    initialValue: string;
    onConfirm: (val: string) => void;
  }>({
    isOpen: false,
    title: "",
    initialValue: "",
    onConfirm: () => {},
  });

  const openPrompt = (title: string, initialValue: string, onConfirm: (val: string) => void) => {
    setPromptData({ isOpen: true, title, initialValue, onConfirm });
  };

  const closePrompt = () => {
    setPromptData(prev => ({ ...prev, isOpen: false }));
  };

  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    confirmLabel?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    onConfirm: () => {},
  });

  const openConfirm = (title: string, message: string, onConfirm: () => void, confirmLabel?: string) => {
    setConfirmData({ isOpen: true, title, message, confirmLabel, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmData(prev => ({ ...prev, isOpen: false }));
  };

  const toggleCollapse = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const fetchData = useCallback(async (tabIdToLoad: string | null) => {
    // 1. Fetch Tabs
    const { data: tabsData } = await supabase.from("tabs").select("*").order("created_at", { ascending: true });
    
    let currentTabs = tabsData || [];
    let loadTab = tabIdToLoad;

    // Create Initial Tab if Empty
    if (currentTabs.length === 0) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data: newTab } = await supabase
          .from("tabs")
          .insert([{ name: window.location.pathname.startsWith("/en") ? "Home" : "Startseite", user_id: sessionData.session.user.id }])
          .select();
        
        if (newTab && newTab.length > 0) {
          currentTabs = newTab;
          // Assign old sections to this new default tab
          await supabase.from("sections").update({ tab_id: newTab[0].id }).is("tab_id", null);
        }
      }
    }

    setTabs(currentTabs);
    
    if (!loadTab && currentTabs.length > 0) {
      // Standardmäßig den ersten ÖFFENTLICHEN Reiter laden - private Reiter
      // dürfen ohne entsperrten Inkognito-Modus nie automatisch aktiv werden.
      const firstPublic = currentTabs.find((t) => !t.is_private);
      loadTab = firstPublic ? firstPublic.id : null;
    }
    
    setActiveTabId(loadTab);

    if (!loadTab) {
      setSections([]);
      return;
    }

    // 2. Fetch Sections & Links
    const { data: sectionsData } = await supabase.from("sections").select("*").order("created_at", { ascending: true });
    const { data: linksData } = await supabase.from("links").select("*").order("created_at", { ascending: false });

    if (sectionsData) {
      const allSecs: Section[] = sectionsData.map((sec) => ({
        id: sec.id,
        name: sec.name,
        parent_id: sec.parent_id,
        tab_id: sec.tab_id,
        color: sec.color || null,
        subSections: [],
        links: linksData
          ? linksData
              .filter((l) => l.section_id === sec.id)
              .map((l) => ({
                id: l.id,
                url: l.url,
                title: l.title,
                description: l.description || "",
                image: l.image || null,
                initial: l.initial || "",
                domain: l.domain || "",
              }))
          : [],
      }));

      // Find relevant root structure for active tab
      const roots = allSecs.filter(s => !s.parent_id && (s.tab_id === loadTab || s.tab_id === null));
      allSecs.forEach(s => {
        if (s.parent_id) {
          const parent = allSecs.find(p => p.id === s.parent_id);
          if (parent) parent.subSections.push(s);
        }
      });

      setSections(roots);
    }
  }, [setSections]);

  useEffect(() => {
    // Nach Login/Registrierung: gemerkten Referral-Code serverseitig einlösen.
    // Der Server prüft alles Weitere (nur neue Accounts, kein Selbst-Referral, einmalig).
    const redeemPendingReferral = async (accessToken: string) => {
      const code = localStorage.getItem("linklib_pending_ref");
      if (!code) return;
      try {
        await fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ code }),
        });
        // Antwort erhalten (eingelöst oder abgelehnt) -> nicht erneut versuchen
        localStorage.removeItem("linklib_pending_ref");
      } catch {
        // Netzwerkfehler: Code behalten und beim nächsten Laden erneut versuchen
      }
    };

    // Nach Klick auf einen Share-Link: Inhalt serverseitig in das eigene Profil
    // kopieren und danach die Reiter/Sektionen im UI aktualisieren.
    const redeemPendingShare = async (accessToken: string) => {
      const token = localStorage.getItem("linklib_pending_share");
      if (!token) return;
      try {
        const res = await fetch("/api/share/redeem", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          localStorage.removeItem("linklib_pending_share");
          const data = await res.json().catch(() => ({}));
          await fetchData(data?.targetTabId || null);
          return;
        }

        // Keine erneute Schleife bei permanenten Fehlern.
        if (res.status === 400 || res.status === 404 || res.status === 409) {
          localStorage.removeItem("linklib_pending_share");
        }
      } catch {
        // Netzwerkfehler: Token behalten und beim nächsten Laden erneut versuchen
      }
    };

    // onAuthStateChange feuert beim Registrieren sofort mit der aktuellen Session (Event "INITIAL_SESSION"),
    // ein zusätzlicher separater getSession()-Aufruf hier würde fetchData() doppelt und parallel auslösen
    // (Race Condition: doppelter "Startseite"-Tab für neue Nutzer).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || "");
        fetchData(null);
        fetchPremiumStatus();
        redeemPendingReferral(session.access_token);
        redeemPendingShare(session.access_token);
      } else {
        setIsLoggedIn(false);
        setUserEmail("");
        setSections([]);
        setTabs([]);
        setActiveTabId(null);
        setPremiumPlan(null);
        setReferralUntil(null);
        setOwnerPremium(false);
        setIncognitoUnlocked(false);
        setIncognitoHash(null);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchData, fetchPremiumStatus]);

  // Tab Methods
  const addTab = async () => {
    openPrompt(t.addTabPrompt, "", async (name) => {
      closePrompt();
      if (!name?.trim()) return;
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      
      const { data } = await supabase.from("tabs").insert([{ name: name.trim(), user_id: sessionData.session.user.id }]).select();
      if (data && data.length > 0) {
        setTabs(prev => [...prev, data[0]]);
        fetchData(data[0].id);
      }
    });
  };

  const renameTab = (tabId: string, oldName: string) => {
    const tab = tabs.find((item) => item.id === tabId);
    setTabEditModal({
      isOpen: true,
      tabId,
      name: oldName,
      color: tab?.color || COLOR_PALETTE[5].value,
    });
  };

  const saveTabEdit = async () => {
    const tabId = tabEditModal.tabId;
    const name = tabEditModal.name.trim();
    if (!tabId || !name) return;

    await supabase.from("tabs").update({ name, color: tabEditModal.color }).eq("id", tabId);
    setTabs((prev) => prev.map((item) => (item.id === tabId ? { ...item, name, color: tabEditModal.color } : item)));
    setTabEditModal({ isOpen: false, tabId: null, name: "", color: COLOR_PALETTE[5].value });
  };

  const deleteTab = async (tabId: string) => {
    openConfirm(t.deleteTabTitle, t.deleteTabMessage, async () => {
      closeConfirm();
      await supabase.from("tabs").delete().eq("id", tabId);

      const remaining = tabs.filter(t => t.id !== tabId);
      setTabs(remaining);
      // Nächsten Tab wählen, der im aktuellen Modus auch sichtbar ist
      const nextTab = remaining.find(t => !t.is_private || incognitoUnlocked) || null;
      fetchData(nextTab ? nextTab.id : null);
    });
  };

  // Inkognito: Reiter privat/öffentlich schalten (nur im entsperrten Modus bedienbar)
  const toggleTabPrivacy = async (tab: Tab) => {
    const newValue = !tab.is_private;
    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, is_private: newValue } : t));
    await supabase.from("tabs").update({ is_private: newValue }).eq("id", tab.id);
  };

  // Klick auf das Auge in der Tab-Leiste: Premium+-Check, dann sperren bzw. entsperren
  const toggleIncognito = () => {
    if (!hasIncognitoAccess) {
      openConfirm(
        t.premiumFeatureTitle,
        t.premiumFeatureMessage,
        () => {
          closeConfirm();
          setUpgradeModalOpen(true);
        },
        t.upgrade
      );
      return;
    }

    if (incognitoUnlocked) {
      // Zurück in den öffentlichen Modus: private Reiter verschwinden sofort
      setIncognitoUnlocked(false);
      const activeTab = tabs.find(t => t.id === activeTabId);
      if (activeTab?.is_private) {
        const firstPublic = tabs.find(t => !t.is_private);
        fetchData(firstPublic ? firstPublic.id : null);
      }
      return;
    }

    // Entsperren: Passwort abfragen - bzw. beim ersten Mal festlegen
    setIncognitoModal({ isOpen: true, mode: incognitoHash ? "unlock" : "setup", error: null });
  };

  const submitIncognitoPassword = async (password: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;

    const hash = await sha256Hex(`${userId}:${password}`);

    if (incognitoModal.mode === "setup") {
      // Erst updaten (Profil existiert evtl. schon durch Stripe), sonst neu anlegen -
      // die Spaltenrechte erlauben Nutzern ausschließlich das Schreiben des Passwort-Hashes.
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({ incognito_password_hash: hash })
        .eq("id", userId)
        .select("id");

      if (updateError) {
        setIncognitoModal(prev => ({ ...prev, error: `${t.saveFailed}: ${updateError.message}` }));
        return;
      }

      if (!updated || updated.length === 0) {
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, incognito_password_hash: hash });
        if (insertError) {
          setIncognitoModal(prev => ({ ...prev, error: `${t.saveFailed}: ${insertError.message}` }));
          return;
        }
      }

      setIncognitoHash(hash);
      setIncognitoUnlocked(true);
      setIncognitoModal({ isOpen: false, mode: "setup", error: null });
    } else {
      if (hash === incognitoHash) {
        setIncognitoUnlocked(true);
        setIncognitoModal({ isOpen: false, mode: "unlock", error: null });
      } else {
        setIncognitoModal(prev => ({ ...prev, error: t.wrongPassword }));
      }
    }
  };

  // Auth Handlers
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return alert(t.fillAllFields);

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
      if (error) alert(t.loginError + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email: emailInput, password: passwordInput });
      if (error) alert(t.signupError + error.message);
      else {
        alert(t.signupSuccess);
        setIsLoginMode(true);
      }
    }
  };

  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) alert(t.githubLoginError + error.message);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) alert(t.googleLoginError + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmailInput("");
    setPasswordInput("");
  };

  // Data Actions
  const addSection = async (parentId: string | null = null) => {
    openPrompt(parentId ? t.addSubSectionPrompt : t.addMainSectionPrompt, "", async (name) => {
      closePrompt();
      if (!name?.trim()) return;

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const { error } = await supabase
        .from("sections")
        .insert([{ name: name.trim(), user_id: sessionData.session.user.id, parent_id: parentId, tab_id: activeTabId }])
        .select();

      if (!error) {
        fetchData(activeTabId);
      } else {
        alert(t.createSectionError + error.message);
      }
    });
  };

  const updateSectionInState = (list: Section[], targetId: string, updater: (s: Section) => Section): Section[] => {
    return list.map(s => {
      if (s.id === targetId) return updater(s);
      if (s.subSections.length > 0) return { ...s, subSections: updateSectionInState(s.subSections, targetId, updater) };
      return s;
    });
  };

  const addLink = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    const url = newLinkInputs[sectionId]?.trim();
    if (!url) return;

    // https als Standard-Protokoll: praktisch jede Seite unterstützt heute TLS,
    // und http-Links würden von Browsern zunehmend blockiert/abgewertet.
    const fullUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    let domain = fullUrl;
    try { domain = new URL(fullUrl).hostname.replace(/^www\./, ""); } catch {}
    const initial = domain.charAt(0).toUpperCase();

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    // Optimistic Update (randomUUID statt Date.now: rein & kollisionsfrei bei schnellen Mehrfach-Adds)
    const tempId = crypto.randomUUID();
    const newLink: Link = { id: tempId, url: fullUrl, title: domain, description: t.loadingMetadata, image: null, initial, domain };
    
    setSections(prev => updateSectionInState(prev, sectionId, s => ({ ...s, links: [newLink, ...s.links] })));
    setNewLinkInputs({ ...newLinkInputs, [sectionId]: "" });

    // DB Insert
    const { data: insertedData, error } = await supabase.from('links').insert([{
        section_id: sectionId, user_id: sessionData.session.user.id, url: fullUrl,
        title: domain, description: t.loadingMetadata, domain, initial
    }]).select();

    if (error || !insertedData) return fetchData(activeTabId);
    const realDbLink = insertedData[0];

    // Fetch Metadata
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`, {
        headers: { Authorization: `Bearer ${sessionData.session.access_token}` },
      });
      if (!res.ok) throw new Error("API Failure");
      const metaData = await res.json();
      
      const title = metaData.title || domain;
      const desc = truncateDescription(metaData.description) || fullUrl;
      const image = metaData.image || null;

      await supabase.from('links').update({ title, description: desc, image }).eq('id', realDbLink.id);
      fetchData(activeTabId);
    } catch {
      await supabase.from('links').update({ description: fullUrl }).eq('id', realDbLink.id);
      fetchData(activeTabId);
    }
  };

  const deleteLink = (e: React.MouseEvent, linkId: string) => {
    e.stopPropagation();
    openConfirm(t.deleteLinkTitle, t.deleteLinkMessage, async () => {
      closeConfirm();
      await supabase.from("links").delete().eq("id", linkId);
      fetchData(activeTabId);
    });
  };

  const shareResource = async (type: "tab" | "section", id: string, label: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      alert("Bitte zuerst anmelden.");
      return;
    }

    try {
      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ type, id }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data?.error || "Share-Link konnte nicht erstellt werden.");
      }

      const shareUrl = data.url as string;

      if (navigator.share) {
        try {
          await navigator.share({
            title: `LinkLib: ${label}`,
            text: `Ich teile mit dir: ${label}`,
            url: shareUrl,
          });
          return;
        } catch {
          // Fallback auf Copy + Direktkanäle
        }
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Share-Link wurde in die Zwischenablage kopiert.");
      } catch {
        alert(`Share-Link:\n${shareUrl}`);
      }

      const waText = encodeURIComponent(`Schau dir diesen Inhalt in LinkLib an: ${shareUrl}`);
      const mailSubject = encodeURIComponent(`LinkLib geteilt: ${label}`);
      const mailBody = encodeURIComponent(`Hi,\n\nich habe diesen Inhalt in LinkLib mit dir geteilt:\n${shareUrl}\n\nNach Login/Registrierung wird er in deinem Profil angelegt.`);

      if (window.confirm("In WhatsApp Web teilen?")) {
        window.open(`https://web.whatsapp.com/send?text=${waText}`, "_blank", "noopener,noreferrer");
        return;
      }
      if (window.confirm("Per E-Mail teilen?")) {
        window.location.href = `mailto:?subject=${mailSubject}&body=${mailBody}`;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      alert("Teilen fehlgeschlagen: " + message);
    }
  };

  // Wird aufgerufen, wenn Links innerhalb einer Sektion neu sortiert ODER von einer anderen Sektion hinzugefügt werden
  const updateSectionLinks = (sectionId: string, newLinks: Link[]) => {
    setSections(prev => updateSectionInState(prev, sectionId, s => {
      const oldIds = new Set(s.links.map(l => l.id));
      const addedLinks = newLinks.filter(l => !oldIds.has(l.id));
      // Links, die neu in dieser Sektion gelandet sind, in der DB umhängen
      addedLinks.forEach(l => {
        supabase.from("links").update({ section_id: sectionId }).eq("id", l.id);
      });
      return { ...s, links: newLinks };
    }));
  };

  const renameSection = async (sectionId: string, oldName: string) => {
    openPrompt(t.renameSectionPrompt, oldName, async (name) => {
      closePrompt();
      if (!name || name.trim() === oldName) return;
      await supabase.from("sections").update({ name: name.trim() }).eq("id", sectionId);
      setSections(prev => updateSectionInState(prev, sectionId, s => ({ ...s, name: name.trim() })));
    });
  };

  const deleteSection = (sectionId: string) => {
    openConfirm(t.deleteSectionTitle, t.deleteSectionMessage, async () => {
      closeConfirm();
      await supabase.from("sections").delete().eq("id", sectionId);
      fetchData(activeTabId);
    });
  };

  // Render Section Recursive
  const renderSection = (section: Section, depth: number) => {
    const isCollapsed = collapsedSections[section.id] || false;

    return (
      <div key={section.id} className={`bg-transparent ${depth > 0 ? "ml-6 mt-4 border-l-2 border-primary/20 pl-5" : ""}`}>
        <div
          className="section-header flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 border-b border-slate-300 pb-2 cursor-move gap-2 sm:gap-0 group"
          style={{
            ...(section.color ? { borderBottomColor: section.color } : {}),
            touchAction: "pan-y",
          }}
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => toggleCollapse(section.id, e)} 
              className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title={isCollapsed ? t.expand : t.collapse}
            >
              {isCollapsed ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              )}
            </button>
            <h3 className={`${depth > 0 ? "text-base font-semibold text-brand-dark" : "text-lg font-semibold text-brand-dark"} m-0 flex items-center gap-2 group/heading cursor-pointer`} onClick={() => renameSection(section.id, section.name)} title={t.clickToEdit}>
              {section.name}
              {section.shared_from_label && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {section.shared_from_label}
                </span>
              )}
              <Edit2 className="w-4 h-4 text-slate-300 opacity-0 group-hover/heading:opacity-100 transition-opacity" />
            </h3>
          </div>
          <div className="flex gap-4 items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setActiveLinkForm(activeLinkForm === section.id ? null : section.id)} className="text-sm font-medium text-primary hover:text-primary-hover">
              {t.addLink}
            </button>
            <button
              onClick={() => shareResource("section", section.id, `Abschnitt ${section.name}`)}
              className="text-sm font-medium text-primary hover:text-primary-hover inline-flex items-center gap-1"
              title="Abschnitt teilen"
            >
              <Share2 className="w-3.5 h-3.5" /> Teilen
            </button>
            {depth === 0 && (
              <button onClick={() => addSection(section.id)} className="text-sm font-medium text-primary hover:text-primary-hover">
                {t.addSubsection}
              </button>
            )}
            <button onClick={() => deleteSection(section.id)} className="text-sm text-danger hover:opacity-80">
              {t.delete}
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            {activeLinkForm === section.id && (
              <form onSubmit={(e) => { addLink(e, section.id); setActiveLinkForm(null); }} className="flex gap-2 mb-4 animate-in slide-in-from-top-1 fade-in duration-200">
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newLinkInputs[section.id] || ""}
                  onChange={(e) => setNewLinkInputs({ ...newLinkInputs, [section.id]: e.target.value })}
                  className="flex-1 p-2.5 rounded-lg border border-slate-300 outline-none focus:border-primary text-sm bg-white"
                  autoFocus
                />
                <button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors whitespace-nowrap">
                  {t.addButton}
                </button>
              </form>
            )}
            
            <ReactSortable
              list={section.links}
              setList={(newList) => updateSectionLinks(section.id, newList)}
              animation={150}
              group={{ name: "links", pull: true, put: true }}
              delayOnTouchOnly={true}
              delay={160}
              touchStartThreshold={8}
              fallbackTolerance={8}
              tag="ul"
              className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 min-h-[12px] rounded-xl transition-colors ${section.links.length === 0 ? "border-2 border-dashed border-slate-200" : ""}`}
            >
              {section.links.map((link) => (
                  <li
                    key={link.id}
                    onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                    className="flex gap-3 items-center py-2 px-3 rounded-xl border border-slate-200 bg-card cursor-grab active:cursor-grabbing hover:shadow-lg hover:-translate-y-1 transition-all relative group/card"
                  >
                    <button 
                      onClick={(e) => deleteLink(e, link.id)}
                      title={t.deleteLinkTitleAttr}
                      className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-muted hover:bg-danger hover:text-white opacity-0 group-hover/card:opacity-100 transition-all text-xs z-10"
                    >
                      ✕
                    </button>
                    <div
                      /* Golden-Ratio-Thumbnail statt Quadrat: 52x32px ≈ φ (1.618) */
                      className="w-13 h-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-primary text-sm font-bold bg-cover bg-center border border-slate-100"
                      style={link.image ? { backgroundImage: `url(${link.image})` } : {}}
                    >
                      {!link.image && link.initial}
                    </div>
                    <div className="overflow-hidden pr-4 flex-1">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block text-brand-dark font-semibold text-sm truncate" onClick={(e) => e.stopPropagation()}>
                        {link.title}
                      </a>
                      <p className="m-0 text-muted text-xs truncate leading-snug" title={link.description}>{link.description}</p>
                    </div>
                  </li>
                ))}
              </ReactSortable>

            {section.subSections.length > 0 && (
              <ReactSortable 
                list={section.subSections} 
                setList={(newList) => setSections(prev => updateSectionInState(prev, section.id, s => ({...s, subSections: newList})))} 
                animation={150} 
                handle=".section-header" 
                delayOnTouchOnly={true}
                delay={160}
                touchStartThreshold={8}
                fallbackTolerance={8}
                className="flex flex-col gap-3"
              >
                {section.subSections.map((sub, index) => (
                  <div key={sub.id}>
                    {renderSection(sub, depth + 1)}

                    {/* Werbung nach allen 10 Untersektionen (entfällt für Premium-Nutzer) */}
                    {!isPremium && (index + 1) % 10 === 0 && index !== section.subSections.length - 1 && (
                      <div className="my-4 pr-4">
                        <span className="block text-micro text-slate-400 uppercase tracking-wider text-center mb-1">{t.adLabel}</span>
                        <div className="bg-white/30 rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                          <AdBanner dataAdSlot="INSERT_YOUR_AD_SLOT_ID_HERE" dataAdFormat="horizontal" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </ReactSortable>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-[url('/bg.svg')] bg-[length:40px_40px] bg-center animate-in fade-in duration-500 font-sans text-brand-dark">
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm -z-10"></div>
        <div className="absolute right-5 top-5 z-20">
          <LanguageSwitcher />
        </div>
        <div className="flex items-center justify-center min-h-screen p-5">
          {/* max-w-shell-golden = max-w-shell / φ² (Goldener Schnitt zum Hauptcontainer) */}
          <div className="w-full max-w-shell-golden text-center z-10">
            <div className="flex items-center justify-center mb-6 drop-shadow-sm">
              <img src="/Wordmark.svg" alt="LinkLib Logo" className="h-[80px] w-auto max-w-full" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">{t.heroTitle}</h1>
            <p className="text-slate-500 font-medium mb-8">{t.heroSubtitle}</p>
            <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="flex gap-2 mb-6 border-b border-slate-200/60 pb-0">
              <button
                className={`flex-1 pb-3 font-bold transition-all border-b-2 text-nav ${
                  isLoginMode ? "text-primary border-primary" : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
                onClick={() => setIsLoginMode(true)}
              >
                {t.login}
              </button>
              <button
                className={`flex-1 pb-3 font-bold transition-all border-b-2 text-nav ${
                  !isLoginMode ? "text-primary border-primary" : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
                onClick={() => setIsLoginMode(false)}
              >
                {t.register}
              </button>
            </div>
            
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder={t.email}
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="p-3.5 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-slate-50/50 focus:bg-white text-brand-dark font-medium placeholder:font-normal"
              />
              <input
                type="password"
                placeholder={t.password}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="p-3.5 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all bg-slate-50/50 focus:bg-white text-brand-dark font-medium placeholder:font-normal"
              />
              <button type="submit" className="bg-primary text-white p-3.5 rounded-xl font-bold hover:bg-primary-hover hover:scale-[1.02] hover:shadow-xl active:scale-95 transition-all mt-2">
                {isLoginMode ? t.startNow : t.createAccount}
              </button>
            </form>
            
            <div className="mt-8 flex flex-col gap-3">
              <div className="relative flex items-center mb-3">
                <div className="flex-grow border-t border-slate-200/80"></div>
                <span className="shrink-0 px-4 text-slate-400 text-xs font-bold tracking-widest">{t.or}</span>
                <div className="flex-grow border-t border-slate-200/80"></div>
              </div>
              
              <button 
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-3 bg-[#24292e] text-white p-3.5 rounded-xl font-semibold hover:bg-[#1b1f23] transition-all hover:shadow-md hover:scale-[1.01]"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                {t.connectGithub}
              </button>
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-brand-dark p-3.5 rounded-xl font-semibold hover:bg-slate-50 transition-all hover:shadow-md hover:scale-[1.01]"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t.continueGoogle}
              </button>
            </div>
          </div>
          </div>
        </div>
        <LandingSections locale={locale} />
        <LegalFooter locale={locale} className="pb-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <header className="max-w-shell mx-auto flex justify-between items-center px-5 py-4 bg-transparent border-b border-transparent sticky top-0 z-20">
        <div className="flex items-center">
          <img src="/Wordmark.svg" alt="LinkLib Logo" className="h-[26px] w-auto max-w-[50vw]" />
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <div className="w-[1px] h-4 bg-slate-300 hidden sm:block"></div>
          <button
            onClick={() => setReferralModalOpen(true)}
            title={t.inviteTitle}
            className="font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-1.5"
          >
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">{t.invite}</span>
          </button>
          <div className="w-[1px] h-4 bg-slate-300 hidden sm:block"></div>
          {isPremium ? (
            <button
              onClick={ownerPremium ? undefined : (premiumPlan ? openBillingPortal : () => setUpgradeModalOpen(true))}
              title={
                ownerPremium
                  ? t.ownerTitle
                  : premiumPlan === "lifetime"
                  ? t.lifetimeTitle
                  : premiumPlan
                    ? t.managePremiumTitle
                    : `${t.referralPremiumUntil}${referralUntil ? new Date(referralUntil).toLocaleDateString(locale === "en" ? "en-US" : "de-DE") : ""}`
              }
              className={`font-bold transition-colors flex items-center gap-1 ${ownerPremium ? "text-emerald-600" : "text-amber-500 hover:text-amber-600"}`}
            >
              ★ {ownerPremium ? "Owner" : premiumPlan === "lifetime" ? "Lifetime" : premiumPlan === "premium_plus" ? "Premium+" : "Premium"}
            </button>
          ) : (
            <button
              onClick={() => setUpgradeModalOpen(true)}
              title={t.adFreeTitle}
              className="font-bold text-primary hover:text-primary-hover transition-colors"
            >
              {t.upgrade}
            </button>
          )}
          <div className="w-[1px] h-4 bg-slate-300 hidden sm:block"></div>
          <button
            onClick={() => setAccountModalOpen(true)}
            title={t.accountTitle}
            className="hidden sm:inline-block font-semibold hover:text-primary transition-colors"
          >
            {userEmail}
          </button>
          <div className="w-[1px] h-4 bg-slate-300 hidden sm:block"></div>
          <button onClick={handleLogout} className="text-slate-500 font-bold hover:text-danger transition-colors px-2">
            {t.logout}
          </button>
        </div>
      </header>

      {/* TABS Navigation */}
      <div className="max-w-shell mx-auto px-5 mb-0">
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-[-1px] items-center pt-2">
          {tabs.filter((tab) => !tab.is_private || incognitoUnlocked).map((tab) => (
            <div key={tab.id} className="relative group/tab flex items-center shrink-0">
              <button 
                onClick={(e) => {
                  // Prevent click from bubbling up and double click event firing on normal clicks
                  e.preventDefault();
                  fetchData(tab.id);
                }}
                onDoubleClick={() => renameTab(tab.id, tab.name)}
                title={t.tabRenameTitle}
                className={`px-5 pt-2.5 pb-3 font-bold text-nav whitespace-nowrap transition-all border-b-2 -mb-[1px] rounded-t-xl hover:bg-slate-50 flex flex-col items-start gap-1 cursor-pointer ${
                  activeTabId === tab.id 
                    ? "border-primary text-primary" 
                    : "border-transparent text-slate-500 hover:text-brand-dark"
                }`}
                style={activeTabId === tab.id && tab.color ? { borderColor: tab.color, color: tab.color } : undefined}
              >
                <div className="flex items-center gap-1 opacity-0 group-hover/tab:opacity-100 transition-opacity w-full justify-start">
                  {incognitoUnlocked && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); toggleTabPrivacy(tab); }}
                      title={tab.is_private ? t.makePublicTitle : t.makePrivateTitle}
                      className={`transition-opacity ${tab.is_private ? "opacity-100 text-slate-600 hover:text-brand-dark" : "opacity-0 group-hover/tab:opacity-100 text-slate-300 hover:text-slate-600"}`}
                    >
                      {tab.is_private ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </span>
                  )}
                  {!tab.is_private && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); shareResource("tab", tab.id, `Reiter ${tab.name}`); }}
                      title="Reiter teilen"
                      className="w-3.5 h-3.5 text-slate-300 hover:text-primary-hover"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); renameTab(tab.id, tab.name); }}
                    title={t.tabRenameTitle}
                    className="w-3.5 h-3.5 text-slate-300 hover:text-primary-hover flex items-center justify-center leading-none"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </span>
                  {tabs.length > 1 && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); deleteTab(tab.id); }}
                      title={t.tabDeleteTitle}
                      className="w-3.5 h-3.5 text-slate-300 hover:text-danger flex items-center justify-center leading-none -translate-y-px"
                    >
                      ✕
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full min-w-0">
                  <span className="truncate min-w-0" style={tab.color ? { color: tab.color } : undefined}>{tab.name}</span>
                  {tab.shared_from_label && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-full shrink-0">
                      {tab.shared_from_label}
                    </span>
                  )}
                </div>
              </button>
              
            </div>
          ))}
          <button 
            onClick={addTab} 
            className="px-4 py-3 font-black text-nav text-slate-400 hover:text-primary whitespace-nowrap shrink-0 hover:bg-slate-50 rounded-t-xl transition-all"
            title={t.createTabTitle}
          >
            +
          </button>
          {/* Inkognito-Auge: immer sichtbar, ganz rechts auf Höhe der Reiter */}
          <button
            onClick={toggleIncognito}
            title={
              incognitoUnlocked
                ? t.endIncognitoTitle
                : t.enterIncognitoTitle
            }
            className={`ml-auto shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
              incognitoUnlocked
                ? "bg-slate-900 text-white shadow-md hover:bg-slate-700"
                : "text-slate-400 hover:text-brand-dark hover:bg-slate-100"
            }`}
          >
            {incognitoUnlocked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <main className="max-w-shell mx-auto px-5 pt-5 pb-20">
        <div className="flex justify-end mb-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <button onClick={() => addSection(null)} className="text-primary hover:bg-slate-100 px-4 py-2 rounded-lg font-medium transition-colors flex gap-2 items-center text-sm border border-slate-200">
            <span className="text-lg leading-none font-bold">+</span> {t.insertSection}
          </button>
        </div>

        {sections.length === 0 && (
          <div className="text-center py-20 px-5 bg-white border border-dashed border-slate-300 rounded-3xl">
            <h3 className="text-lg font-bold text-brand-dark mb-2">{t.emptyTitle}</h3>
            <p className="text-slate-500 max-w-md mx-auto line-clamp-3">
              {t.emptySubtitle}
            </p>
          </div>
        )}

        <ReactSortable list={sections} setList={setSections} animation={150} handle=".section-header" className="flex flex-col gap-6">
          {sections.map((section, index) => (
            <div key={section.id}>
              {renderSection(section, 0)}
              
              {/* Dezent platzierte Werbung nach jeder zweiten Hauptsektion (entfällt für Premium-Nutzer) */}
              {!isPremium && (index + 1) % 2 === 0 && index !== sections.length - 1 && (
                <div className="my-6 px-4 animate-in fade-in duration-500">
                  <span className="block text-micro text-slate-400 font-bold uppercase tracking-widest text-center mb-2">{t.adLabel}</span>
                  <div className="bg-white/50 rounded-3xl border border-slate-100 overflow-hidden shadow-sm p-1">
                    <AdBanner dataAdSlot="INSERT_YOUR_AD_SLOT_ID_HERE" dataAdFormat="horizontal" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </ReactSortable>
      </main>
      {/* Rechtliche Pflichtlinks (Impressum, Datenschutz, AGB, Widerruf, Cookie-Einstellungen) */}
      <footer className="max-w-shell mx-auto px-5 pb-8 text-center">
        <LegalFooter locale={locale} />
      </footer>
      {tabEditModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-brand-dark m-0">{t.renameTabPrompt}</h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <input
                type="text"
                value={tabEditModal.name}
                onChange={(e) => setTabEditModal((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-brand-dark"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{isEn ? "Text color" : "Schriftfarbe"}</p>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setTabEditModal((prev) => ({ ...prev, color: c.value }))}
                      title={c.name}
                      className="h-9 rounded-xl border transition-transform hover:scale-[1.03]"
                      style={{ backgroundColor: c.value, borderColor: tabEditModal.color === c.value ? "#0f172a" : "transparent" }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setTabEditModal({ isOpen: false, tabId: null, name: "", color: COLOR_PALETTE[5].value })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-dark hover:bg-slate-200 rounded-lg transition-colors"
              >
                {isEn ? "Cancel" : "Abbrechen"}
              </button>
              <button
                onClick={saveTabEdit}
                className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md transition-colors"
              >
                {isEn ? "Save" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Prompt Modal */}
      <PromptModal
        isOpen={promptData.isOpen}
        title={promptData.title}
        initialValue={promptData.initialValue}
        locale={locale}
        onConfirm={promptData.onConfirm}
        onCancel={closePrompt}
      />
      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmData.isOpen}
        title={confirmData.title}
        message={confirmData.message}
        confirmLabel={confirmData.confirmLabel}
        locale={locale}
        onConfirm={confirmData.onConfirm}
        onCancel={closeConfirm}
      />
      {/* Premium Upgrade Modal */}
      <UpgradeModal isOpen={upgradeModalOpen} locale={locale} onClose={() => setUpgradeModalOpen(false)} />
      {/* Freunde einladen (Empfehlungsprogramm) - bei jedem Öffnen frisch gemountet */}
      {referralModalOpen && <ReferralModal isOpen locale={locale} onClose={() => setReferralModalOpen(false)} />}
      {/* Konto verwalten (Abo, Passwort, Account-Löschung) - bei jedem Öffnen frisch gemountet */}
      {accountModalOpen && (
        <AccountModal
          isOpen
          locale={locale}
          userEmail={userEmail}
          onClose={() => setAccountModalOpen(false)}
          onSubscriptionChanged={fetchPremiumStatus}
        />
      )}
      {/* Inkognito Passwort Modal */}
      <IncognitoPasswordModal
        isOpen={incognitoModal.isOpen}
        mode={incognitoModal.mode}
        locale={locale}
        error={incognitoModal.error}
        onConfirm={submitIncognitoPassword}
        onCancel={() => setIncognitoModal(prev => ({ ...prev, isOpen: false, error: null }))}
      />
    </div>
  );
}
