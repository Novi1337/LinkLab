import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BookmarkletLink, CodeSnippet } from "./widgets";

export const metadata: Metadata = {
  title: "Save-Button für deine Website – LinkLib",
  description:
    "Binde den LinkLib Save-Button auf deiner Website ein oder nutze das Bookmarklet: Links, Videos und Tweets mit einem Klick in deiner Link-Bibliothek speichern – ganz ohne Kopieren.",
};

const EMBED_SNIPPET = `<!-- LinkLib Save-Button -->
<a href="https://www.getlinklib.com/save" class="linklib-save-button" data-label="Speichern"></a>
<script async src="https://www.getlinklib.com/save-button.js"></script>`;

export default function SaveButtonPage() {
  return (
    <div className="min-h-screen font-sans text-brand-dark">
      {/* Lädt das echte Embed-Script, damit die Demo unten live funktioniert */}
      <Script src="/save-button.js" strategy="lazyOnload" />

      <header className="max-w-shell mx-auto flex justify-between items-center px-5 py-4">
        <Link href="/">
          <img src="/Wordmark.svg" alt="LinkLib Logo" className="h-[26px] w-auto" />
        </Link>
        <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          Zur App →
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-8 pb-24 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl font-bold mb-3">Der LinkLib Save-Button</h1>
          <p className="text-muted leading-relaxed m-0">
            Speichere Videos, Tweets, Artikel und mehr mit einem Klick in deiner
            Link-Bibliothek – ohne URLs zu kopieren. Website-Betreiber können den
            Button einbinden, alle anderen nutzen einfach das Bookmarklet.
          </p>
        </div>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">1. Button auf deiner Website einbinden</h2>
          <p className="text-sm text-muted mb-4">
            Füge dieses Snippet an der gewünschten Stelle deiner Seite ein. Der Button
            erscheint im LinkLib-Look und speichert beim Klick automatisch die aktuelle
            Seite (bzw. die per <code className="bg-slate-100 px-1 rounded">data-url</code> angegebene Adresse).
          </p>
          <CodeSnippet code={EMBED_SNIPPET} />
          <ul className="text-xs text-muted mt-4 flex flex-col gap-1.5 list-disc pl-4">
            <li><code className="bg-slate-100 px-1 rounded">data-url</code> – bestimmte URL speichern (Standard: aktuelle Seite)</li>
            <li><code className="bg-slate-100 px-1 rounded">data-title</code> – eigener Titel (Standard: Seitentitel)</li>
            <li><code className="bg-slate-100 px-1 rounded">data-label</code> – Beschriftung neben dem Icon; weglassen für einen reinen Icon-Button</li>
            <li><code className="bg-slate-100 px-1 rounded">data-size</code> – Button-Höhe in Pixeln (Standard: 32)</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">2. Live ausprobieren</h2>
          <p className="text-sm text-muted mb-4">
            So sieht der Button aus – ein Klick öffnet das Speichern-Fenster und legt
            diese Seite in deiner Bibliothek ab:
          </p>
          <div className="flex items-center gap-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 justify-center">
            <a href="/save" className="linklib-save-button" data-label="Speichern"></a>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">3. Bookmarklet – für alle anderen Seiten</h2>
          <p className="text-sm text-muted mb-4">
            Ziehe diesen Knopf in deine Lesezeichenleiste. Danach kannst du auf jeder
            beliebigen Website (YouTube, X, Blogs …) auf das Lesezeichen klicken, um die
            Seite sofort in LinkLib zu speichern:
          </p>
          <div className="flex justify-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6">
            <BookmarkletLink />
          </div>
        </section>
      </main>
    </div>
  );
}
