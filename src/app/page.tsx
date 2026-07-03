"use client";

import { useState, useEffect } from "react";
import { ReactSortable } from "react-sortablejs";

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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return alert("Please fill out all fields.");
    
    if (!isLoginMode) {
      alert("Successfully registered! You will now be logged in.");
    }
    
    setUserEmail(emailInput);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
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

  const addSection = () => {
    const name = prompt("What should the new section be called?");
    if (!name?.trim()) return;
    setSections([{ id: Date.now().toString(), name: name.trim(), links: [] }, ...sections]);
  };

  const addLink = async (e: React.FormEvent, sectionId: string) => {
    e.preventDefault();
    const url = newLinkInputs[sectionId]?.trim();
    if (!url) return;

    const fullUrl = ensureProtocol(url);
    const domain = parseDomain(fullUrl);
    const initial = domain.charAt(0).toUpperCase();

    const newLink: Link = {
      id: Date.now().toString(),
      url: fullUrl,
      title: domain,
      description: "Loading metadata...",
      image: null,
      initial,
      domain,
    };

    // Optimistically update UI
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, links: [newLink, ...s.links] } : s))
    );
    setNewLinkInputs({ ...newLinkInputs, [sectionId]: "" });

    // Fetch metadata utilizing our own Next.js API route
    try {
      const res = await fetch(`/api/metadata?url=${encodeURIComponent(fullUrl)}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      
      const title = data.title || domain;
      const desc = data.description || fullUrl;
      const image = data.image || null;

      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            links: s.links.map((l) =>
              l.id === newLink.id
                ? { ...l, title, description: desc.substring(0, 100), image }
                : l
            ),
          };
        })
      );
    } catch {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            links: s.links.map((l) => (l.id === newLink.id ? { ...l, description: fullUrl } : l)),
          };
        })
      );
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-5">
        <div className="w-full max-w-[400px] text-center">
          <h1 className="text-3xl font-semibold text-primary mb-8">LinkLib - Your Link Library</h1>
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
                Register
              </button>
            </div>
            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="p-3 rounded-lg border border-slate-300 outline-none focus:border-primary"
              />
              <input
                type="password"
                placeholder="Password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="p-3 rounded-lg border border-slate-300 outline-none focus:border-primary"
              />
              <button type="submit" className="bg-primary text-white p-3 rounded-lg font-medium hover:bg-primary-hover transition-colors">
                {isLoginMode ? "Login" : "Register"}
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
            Logout
          </button>
        </div>
      </header>
      
      <main className="max-w-[1100px] mx-auto mt-8 px-5">
        <div className="flex justify-start mb-5">
          <button onClick={addSection} className="bg-primary text-white px-4 py-3 rounded-lg font-medium hover:bg-primary-hover transition-colors">
            + New Section
          </button>
        </div>

        <ReactSortable list={sections} setList={setSections} animation={150} handle=".section-header" className="flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-transparent">
              <div className="section-header flex justify-between items-center mb-4 border-b border-slate-300 pb-1 cursor-move">
                <h3 className="text-lg font-medium m-0">{section.name}</h3>
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
                  Add Link
                </button>
              </form>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.links.map((link) => (
                  <li
                    key={link.id}
                    onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                    className="flex gap-4 items-center p-4 rounded-lg border border-slate-200 bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div
                      className="w-[60px] h-[60px] shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-primary text-2xl font-bold bg-cover bg-center"
                      style={link.image ? { backgroundImage: `url(${link.image})` } : {}}
                    >
                      {!link.image && link.initial}
                    </div>
                    <div className="overflow-hidden">
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
