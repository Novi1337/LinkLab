import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BookmarkletLink, CodeSnippet } from "./widgets";
import { localizePath, type AppLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "LinkLib Save Button for your website",
  description:
    "Embed the LinkLib Save Button on your site or use the bookmarklet to save links, videos, and posts to your library in one click.",
};

const buildEmbedSnippet = (locale: AppLocale) => `<!-- LinkLib Save-Button -->
<a href="https://www.getlinklib.com/save" class="linklib-save-button" data-label="${locale === "en" ? "Save" : "Speichern"}"></a>
<script async src="https://www.getlinklib.com/save-button.js"></script>`;

export default async function SaveButtonPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className="min-h-screen font-sans text-brand-dark">
      {/* Lädt das echte Embed-Script, damit die Demo unten live funktioniert */}
      <Script src="/save-button.js" strategy="lazyOnload" />

      <header className="max-w-shell mx-auto flex justify-between items-center px-5 py-4">
        <Link href={localizePath("/", locale)}>
          <img src="/Wordmark.svg" alt="LinkLib Logo" className="h-[26px] w-auto" />
        </Link>
        <Link href={localizePath("/", locale)} className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          {isEn ? "Go to app →" : "Zur App →"}
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-8 pb-24 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl font-bold mb-3">{isEn ? "The LinkLib Save Button" : "Der LinkLib Save-Button"}</h1>
          <p className="text-muted leading-relaxed m-0">
            {isEn
              ? "Save videos, posts, articles, and more to your LinkLib library in one click, without copying URLs. Website owners can embed the button, everyone else can use the bookmarklet."
              : "Speichere Videos, Tweets, Artikel und mehr mit einem Klick in deiner Link-Bibliothek – ohne URLs zu kopieren. Website-Betreiber können den Button einbinden, alle anderen nutzen einfach das Bookmarklet."}
          </p>
        </div>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">{isEn ? "1. Embed the button on your website" : "1. Button auf deiner Website einbinden"}</h2>
          <p className="text-sm text-muted mb-4">
            {isEn
              ? "Paste this snippet where you want the button to appear. It uses the LinkLib style and saves the current page on click (or a custom URL via "
              : "Füge dieses Snippet an der gewünschten Stelle deiner Seite ein. Der Button erscheint im LinkLib-Look und speichert beim Klick automatisch die aktuelle Seite (bzw. die per "}
            <code className="bg-slate-100 px-1 rounded">data-url</code>
            {isEn ? ")." : " angegebene Adresse)."}
          </p>
          <CodeSnippet code={buildEmbedSnippet(locale)} locale={locale} />
          <ul className="text-xs text-muted mt-4 flex flex-col gap-1.5 list-disc pl-4">
            <li><code className="bg-slate-100 px-1 rounded">data-url</code> – {isEn ? "save a specific URL (default: current page)" : "bestimmte URL speichern (Standard: aktuelle Seite)"}</li>
            <li><code className="bg-slate-100 px-1 rounded">data-title</code> – {isEn ? "custom title (default: page title)" : "eigener Titel (Standard: Seitentitel)"}</li>
            <li><code className="bg-slate-100 px-1 rounded">data-label</code> – {isEn ? "text label next to icon; remove for icon-only button" : "Beschriftung neben dem Icon; weglassen für einen reinen Icon-Button"}</li>
            <li><code className="bg-slate-100 px-1 rounded">data-size</code> – {isEn ? "button height in pixels (default: 32)" : "Button-Höhe in Pixeln (Standard: 32)"}</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">{isEn ? "2. Try it live" : "2. Live ausprobieren"}</h2>
          <p className="text-sm text-muted mb-4">
            {isEn
              ? "This is how the button looks. One click opens the save popup and stores this page in your library:"
              : "So sieht der Button aus – ein Klick öffnet das Speichern-Fenster und legt diese Seite in deiner Bibliothek ab:"}
          </p>
          <div className="flex items-center gap-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 justify-center">
            <a href={localizePath("/save", locale)} className="linklib-save-button" data-label={isEn ? "Save" : "Speichern"}></a>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">{isEn ? "3. Bookmarklet for any website" : "3. Bookmarklet – für alle anderen Seiten"}</h2>
          <p className="text-sm text-muted mb-4">
            {isEn
              ? "Drag this button to your bookmarks bar. Then, on any website (YouTube, X, blogs, and more), click it to save the current page to LinkLib instantly:"
              : "Ziehe diesen Knopf in deine Lesezeichenleiste. Danach kannst du auf jeder beliebigen Website (YouTube, X, Blogs …) auf das Lesezeichen klicken, um die Seite sofort in LinkLib zu speichern:"}
          </p>
          <div className="flex justify-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6">
            <BookmarkletLink locale={locale} />
          </div>
        </section>
      </main>
    </div>
  );
}
