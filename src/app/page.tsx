"use client";

import { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";
import { supabase } from "@/lib/supabaseClient";

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
  links: Link[];
};

export default function Home() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [newLinkInputs, setNewLinkInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || "");
        fetchData();
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || "");
        fetchData();
      } else {
        setIsLoggedIn(false);
        setUserEmail("");
        setSections([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchData = async () => {
    // Fetch sections
    const { data: sectionsData, error: sErr } = await supabase
      .from("sections")
      .select("*")
      .order("created_at", { ascending: true });

    // Fetch links
    const { data: linksData, error: lErr } = await supabase
      .from("links")
      .select("*")
      .order("created_at", { ascending: false });

    if (sectionsData) {
      const builtSections: Section[] = sectionsData.map((sec) => ({
        id: sec.id,
        name: sec.name,
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
      setSections(builtSections);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return alert("Please fill out all fields.");

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });
      if (error) alert("Es gab einen Fehler beim Login: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({
        email: emailInput,
        password: passwordInput,
      });
      if (error) {
        alert("Fehler bei der Registrierung: " + error.message);
      } else {
        alert("Erfolgreich registriert!");
        setIsLoginMode(true);
      }
    }
  };

  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) alert("GitHub Login Fehler: " + error.message);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });
    if (error) alert("Google Login Fehler: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmailInput("");
    setPasswordInput("");
  };

  const parseDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  const ensureProtocol = (url: string) => {
    return /^https?:\/\//i.test(url) ? url : `http://${url}`;
  };

  const addSection = async () => {
    const name = prompt("Wie soll die neue Sektion heißen?");
    if (!name?.trim()) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const { data, error } = await supabase
      .from("sections")
      .insert([{ name: name.trim(), user_id: sessionData.session.user.id }])
      .select();

    if (data && data.length > 0) {
      setSections([...sections, { id: data[0].id, name: data[0].name, links: [] }]);
    } else if (error) {
      alert("Fehler beim Erstellen der Sektion: " + error.message);
    }
  };

  const addLink = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    const url = newLinkInputs[sectionId]?.trim();
    if (!url) return;

    const fullUrl = ensureProtocol(url);
    const domain = parseDomain(fullUrl);
    const initial = domain.charAt(0).toUpperCase();

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    // Insert locally first (Optimistic update) setup empty metadata state
    const tempId = Date.now().toString();
    const newLink: Link = {
        id: tempId, url: fullUrl, title: domain, description: "Lade Metadaten...", image: null, initial, domain
    };

    setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, links: [newLink, ...s.links] } : s))
    );
    setNewLinkInputs({ ...newLinkInputs, [sectionId]: "" });

    // Store dummy meta safely to DB
    const { data: insertedData, error } = await supabase.from('links').insert([{
        section_id: sectionId, user_id: sessionData.session.user.id, url: fullUrl,
        title: domain, description: "Lade Metadaten...", domain, initial
    }]).select();

    if (error || !insertedData) {
        alert("Konnten den Link nicht in der Datenbank speichern.");
        return fetchData();
    }
    const realDbLink = insertedData[0];

    // Fetch real Metadata
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`);
      if (!res.ok) throw new Error("API Failure");
      const metaData = await res.json();
      
      const title = metaData.title || domain;
      const desc = metaData.description?.substring(0, 100) || fullUrl;
      const image = metaData.image || null;

      // Update in DB
      await supabase.from('links').update({ title, description: desc, image }).eq('id', realDbLink.id);
      
      // Load everything fresh to avoid ID mismatching state vs DB
      fetchData();
    } catch {
      await supabase.from('links').update({ description: fullUrl }).eq('id', realDbLink.id);
      fetchData();
    }
  };

  const deleteLink = async (e: React.MouseEvent, linkId: string) => {
    e.stopPropagation();
    if (confirm("Link wirklich löschen?")) {
      await supabase.from("links").delete().eq("id", linkId);
      fetchData();
    }
  };

  const deleteSection = async (sectionId: string) => {
    if (confirm("Sektion und ALLE enthaltenen Links wirklich löschen?")) {
      await supabase.from("sections").delete().eq("id", sectionId);
      fetchData();
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-5">
        <div className="w-full max-w-[400px] text-center">
          <h1 className="text-3xl font-semibold text-primary mb-8">LinkLib - Deine Link Bibliothek</h1>
          <div className="bg-card rounded-lg p-8 shadow-md">
            <div className="flex gap-2 mb-5 border-b-2 border-slate-200 pb-2">
              <button
                className={`flex-1 p-2 font-medium transition-colors ${
                  isLoginMode ? "text-primary border-b-2 border-primary -mb-[10px]" : "text-muted"
                }`}
                onClick={() => setIsLoginMode(true)}
              >
                Login
              </button>
              <button
                className={`flex-1 p-2 font-medium transition-colors ${
                  !isLoginMode ? "text-primary border-b-2 border-primary -mb-[10px]" : "text-muted"
                }`}
                onClick={() => setIsLoginMode(false)}
              >
                Registrieren
              </button>
            </div>
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="E-Mail Adresse"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="p-3 rounded-lg border border-slate-300 outline-none focus:border-primary"
              />
              <input
                type="password"
                placeholder="Passwort"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="p-3 rounded-lg border border-slate-300 outline-none focus:border-primary"
              />
              <button type="submit" className="bg-primary text-white p-3 rounded-lg font-medium hover:bg-primary-hover transition-colors">
                {isLoginMode ? "Anmelden" : "Konto erstellen"}
              </button>
            </form>
            
            <div className="mt-6 flex flex-col gap-3">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="shrink-0 px-3 text-muted text-sm">Oder</span>
                <div className="flex-grow border-t border-slate-300"></div>
              </div>
              
              <button 
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-2 bg-[#24292e] text-white p-3 rounded-lg font-medium hover:bg-[#1b1f23] transition-colors"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                Mit GitHub anmelden
              </button>
              
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 p-3 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Mit Google anmelden
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-[1100px] mx-auto flex justify-between items-center p-4 bg-card border-b border-slate-200">
        <h2 className="text-xl font-semibold text-primary m-0">LinkLib</h2>
        <div className="flex items-center gap-4 text-sm text-muted">
          <span>{userEmail}</span>
          <button onClick={handleLogout} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Abmelden
          </button>
        </div>
      </header>
      
      <main className="max-w-[1100px] mx-auto mt-8 px-5">
        <div className="flex justify-start mb-5">
          <button onClick={addSection} className="bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors">
            + Neue Sektion
          </button>
        </div>

        <ReactSortable list={sections} setList={setSections} animation={150} handle=".section-header" className="flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-transparent">
              <div className="section-header flex justify-between items-center mb-4 border-b border-slate-300 pb-1 cursor-move">
                <h3 className="text-lg font-medium m-0">{section.name}</h3>
                <button onClick={() => deleteSection(section.id)} className="text-xs text-danger hover:underline">Sektion löschen</button>
              </div>
              <form onSubmit={(e) => addLink(e, section.id)} className="flex gap-2 mb-4">
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newLinkInputs[section.id] || ""}
                  onChange={(e) => setNewLinkInputs({ ...newLinkInputs, [section.id]: e.target.value })}
                  className="flex-1 p-2 rounded-lg border border-slate-300 outline-none focus:border-primary"
                />
                <button type="submit" className="bg-primary text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors">
                  Link hinzufügen
                </button>
              </form>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.links.map((link) => (
                  <li
                    key={link.id}
                    onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                    className="flex gap-4 items-center p-4 rounded-lg border border-slate-200 bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all relative group"
                  >
                    <button 
                      onClick={(e) => deleteLink(e, link.id)}
                      title="Link löschen"
                      className="absolute top-2 right-2 text-muted hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                    <div
                      className="w-[60px] h-[60px] shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-primary text-2xl font-bold bg-cover bg-center"
                      style={link.image ? { backgroundImage: `url(${link.image})` } : {}}
                    >
                      {!link.image && link.initial}
                    </div>
                    <div className="overflow-hidden pr-4">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block text-slate-900 font-medium mb-1 text-[15px] truncate" onClick={(e) => e.stopPropagation()}>
                        {link.title}
                      </a>
                      <p className="m-0 text-muted text-[13px] truncate">{link.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </ReactSortable>
      </main>
    </div>
  );
}
