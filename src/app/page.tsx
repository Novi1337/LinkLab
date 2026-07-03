"use client";

import { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";
import { supabase } from "@/lib/supabaseClient";
import { AdBanner } from "@/components/AdBanner";

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
  links: Link[];
  subSections: Section[];
};

export default function Home() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  
  // We'll manage a tree of sections. Root sections have no parent_id.
  const [sections, setSections] = useState<Section[]>([]);
  const [newLinkInputs, setNewLinkInputs] = useState<{ [key: string]: string }>({});
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({});

  const toggleCollapse = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || "");
        fetchData();
      }
    });

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
    const { data: sectionsData } = await supabase.from("sections").select("*").order("created_at", { ascending: true });
    const { data: linksData } = await supabase.from("links").select("*").order("created_at", { ascending: false });

    if (sectionsData) {
      // Create flat list mapped to our interface
      const allSecs: Section[] = sectionsData.map((sec) => ({
        id: sec.id,
        name: sec.name,
        parent_id: sec.parent_id,
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

      const roots = allSecs.filter(s => !s.parent_id);
      allSecs.forEach(s => {
        if (s.parent_id) {
          const parent = allSecs.find(p => p.id === s.parent_id);
          if (parent) parent.subSections.push(s);
        }
      });
      setSections(roots);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return alert("Bitte fülle alle Felder aus.");

    if (isLoginMode) {
      const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
      if (error) alert("Fehler beim Login: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email: emailInput, password: passwordInput });
      if (error) alert("Fehler bei der Registrierung: " + error.message);
      else {
        alert("Erfolgreich registriert!");
        setIsLoginMode(true);
      }
    }
  };

  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) alert("GitHub Login Fehler: " + error.message);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } });
    if (error) alert("Google Login Fehler: " + error.message);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setEmailInput("");
    setPasswordInput("");
  };

  const addSection = async (parentId: string | null = null) => {
    const name = prompt(parentId ? "Wie soll die Untersektion heißen?" : "Wie soll die neue Hauptsektion heißen?");
    if (!name?.trim()) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const { data, error } = await supabase
      .from("sections")
      .insert([{ name: name.trim(), user_id: sessionData.session.user.id, parent_id: parentId }])
      .select();

    if (data && data.length > 0) {
      fetchData(); // Reload safely to build tree
    } else if (error) {
      alert("Fehler beim Erstellen der Sektion: " + error.message);
    }
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

    const fullUrl = /^https?:\/\//i.test(url) ? url : `http://${url}`;
    let domain = fullUrl;
    try { domain = new URL(fullUrl).hostname.replace(/^www\./, ""); } catch {}
    const initial = domain.charAt(0).toUpperCase();

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    // Optimistic Update
    const tempId = Date.now().toString();
    const newLink: Link = { id: tempId, url: fullUrl, title: domain, description: "Lade Metadaten...", image: null, initial, domain };
    
    setSections(prev => updateSectionInState(prev, sectionId, s => ({ ...s, links: [newLink, ...s.links] })));
    setNewLinkInputs({ ...newLinkInputs, [sectionId]: "" });

    // DB Insert
    const { data: insertedData, error } = await supabase.from('links').insert([{
        section_id: sectionId, user_id: sessionData.session.user.id, url: fullUrl,
        title: domain, description: "Lade Metadaten...", domain, initial
    }]).select();

    if (error || !insertedData) return fetchData();
    const realDbLink = insertedData[0];

    // Fetch Metadata
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`);
      if (!res.ok) throw new Error("API Failure");
      const metaData = await res.json();
      
      const title = metaData.title || domain;
      const desc = metaData.description?.substring(0, 100) || fullUrl;
      const image = metaData.image || null;

      await supabase.from('links').update({ title, description: desc, image }).eq('id', realDbLink.id);
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
    if (confirm("Sektion (und ihre Untersektionen/Links) wirklich löschen?")) {
      await supabase.from("sections").delete().eq("id", sectionId);
      fetchData();
    }
  };

  // Render Section Recursive
  const renderSection = (section: Section, depth: number) => {
    const isCollapsed = collapsedSections[section.id] || false;

    return (
      <div key={section.id} className={`bg-transparent ${depth > 0 ? "ml-8 mt-6 border-l-2 border-primary/20 pl-6" : ""}`}>
        <div className="section-header flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 border-b border-slate-300 pb-2 cursor-move gap-2 sm:gap-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => toggleCollapse(section.id, e)} 
              className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title={isCollapsed ? "Aufklappen" : "Zuklappen"}
            >
              {isCollapsed ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              )}
            </button>
            <h3 className={`${depth > 0 ? "text-lg font-medium text-slate-700" : "text-xl font-semibold text-slate-800"} m-0`}>
              {section.name}
            </h3>
          </div>
          <div className="flex gap-4 items-center">
            <button onClick={() => addSection(section.id)} className="text-sm font-medium text-primary hover:text-primary-hover">
              + Untersektion
            </button>
            <button onClick={() => deleteSection(section.id)} className="text-sm text-danger hover:opacity-80">
              Löschen
            </button>
          </div>
        </div>
        
        {!isCollapsed && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
            <form onSubmit={(e) => addLink(e, section.id)} className="flex gap-2 mb-6">
              <input
                type="url"
                required
                placeholder="https://..."
                value={newLinkInputs[section.id] || ""}
                onChange={(e) => setNewLinkInputs({ ...newLinkInputs, [section.id]: e.target.value })}
                className="flex-1 p-2.5 rounded-lg border border-slate-300 outline-none focus:border-primary text-sm bg-white"
              />
              <button type="submit" className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors whitespace-nowrap">
                Link hinzufügen
              </button>
            </form>
            
            {section.links.length > 0 && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
                {section.links.map((link) => (
                  <li
                    key={link.id}
                    onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                    className="flex gap-4 items-center p-4 rounded-xl border border-slate-200 bg-card cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all relative group"
                  >
                    <button 
                      onClick={(e) => deleteLink(e, link.id)}
                      title="Link löschen"
                      className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-muted hover:bg-danger hover:text-white opacity-0 group-hover:opacity-100 transition-all text-xs"
                    >
                      ✕
                    </button>
                    <div
                      className="w-[56px] h-[56px] shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-primary text-xl font-bold bg-cover bg-center border border-slate-100"
                      style={link.image ? { backgroundImage: `url(${link.image})` } : {}}
                    >
                      {!link.image && link.initial}
                    </div>
                    <div className="overflow-hidden pr-4">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="block text-slate-800 font-semibold mb-1 text-[15px] truncate" onClick={(e) => e.stopPropagation()}>
                        {link.title}
                      </a>
                      <p className="m-0 text-muted text-[13px] line-clamp-2 leading-snug">{link.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {section.subSections.length > 0 && (
              <ReactSortable 
                list={section.subSections} 
                setList={(newList) => setSections(prev => updateSectionInState(prev, section.id, s => ({...s, subSections: newList})))} 
                animation={150} 
                handle=".section-header" 
                className="flex flex-col gap-4"
              >
                {section.subSections.map((sub) => renderSection(sub, depth + 1))}
              </ReactSortable>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-5">
        <div className="w-full max-w-[420px] text-center">
          <h1 className="text-3xl font-bold text-primary mb-8">LinkLab</h1>
          <div className="bg-card rounded-2xl p-8 shadow-xl border border-slate-100">
            <div className="flex gap-2 mb-6 border-b border-slate-200 pb-0">
              <button
                className={`flex-1 pb-3 font-semibold transition-colors border-b-2 ${
                  isLoginMode ? "text-primary border-primary" : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
                onClick={() => setIsLoginMode(true)}
              >
                Anmelden
              </button>
              <button
                className={`flex-1 pb-3 font-semibold transition-colors border-b-2 ${
                  !isLoginMode ? "text-primary border-primary" : "text-slate-400 border-transparent hover:text-slate-600"
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
                className="p-3.5 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white"
              />
              <input
                type="password"
                placeholder="Passwort"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="p-3.5 rounded-xl border border-slate-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-slate-50 focus:bg-white"
              />
              <button type="submit" className="bg-primary text-white p-3.5 rounded-xl font-semibold hover:bg-primary-hover hover:shadow-lg transition-all mt-2">
                {isLoginMode ? "Anmelden" : "Konto erstellen"}
              </button>
            </form>
            
            <div className="mt-8 flex flex-col gap-3">
              <div className="relative flex items-center mb-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="shrink-0 px-4 text-slate-400 text-sm font-medium">ODER</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              
              <button 
                onClick={handleGithubLogin}
                className="flex items-center justify-center gap-3 bg-[#24292e] text-white p-3.5 rounded-xl font-medium hover:bg-[#1b1f23] transition-all hover:shadow-md"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                Mit GitHub
              </button>
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 p-3.5 rounded-xl font-medium hover:bg-slate-50 transition-all hover:shadow-md"
                type="button"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Mit Google
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="max-w-[1100px] mx-auto flex justify-between items-center p-4 bg-card border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <h2 className="text-2xl font-bold text-primary m-0">LinkLab</h2>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span className="hidden sm:inline-block font-medium">{userEmail}</span>
          <button onClick={handleLogout} className="border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Abmelden
          </button>
        </div>
      </header>
      
      <main className="max-w-[1100px] mx-auto mt-8 px-5 pb-20">
        <div className="flex justify-start mb-8">
          <button onClick={() => addSection(null)} className="bg-primary hover:bg-primary-hover text-white shadow-md px-5 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg flex gap-2 items-center">
            <span className="text-xl leading-none">+</span> Neue Sektion
          </button>
        </div>

        <ReactSortable list={sections} setList={setSections} animation={150} handle=".section-header" className="flex flex-col gap-8">
          {sections.map((section, index) => (
            <div key={section.id}>
              {renderSection(section, 0)}
              
              {/* Dezent platzierte Werbung nach jeder zweiten Hauptsektion */}
              {(index + 1) % 2 === 0 && index !== sections.length - 1 && (
                <div className="my-8 px-4">
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider text-center mb-2">Anzeige</span>
                  <div className="bg-white/50 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <AdBanner dataAdSlot="INSERT_YOUR_AD_SLOT_ID_HERE" dataAdFormat="horizontal" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </ReactSortable>
      </main>
    </div>
  );
}
