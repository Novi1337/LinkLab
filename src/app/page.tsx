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
