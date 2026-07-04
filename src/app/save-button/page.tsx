import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { BookmarkletLink, CodeSnippet } from "./widgets";

export const metadata: Metadata = {
  title: "Save Button for Your Website - LinkLib",
  description:
    "Embed the LinkLib Save Button on your website or use the bookmarklet to save links, videos, and posts to your library in one click — no copy and paste required.",
};

const EMBED_SNIPPET = `<!-- LinkLib Save-Button -->
<a href="https://www.getlinklib.com/save" class="linklib-save-button" data-label="Save"></a>
<script async src="https://www.getlinklib.com/save-button.js"></script>`;

export default function SaveButtonPage() {
  return (
    <div className="min-h-screen font-sans text-brand-dark">
      {/* Loads the real embed script so the demo below works live */}
      <Script src="/save-button.js" strategy="lazyOnload" />

      <header className="max-w-shell mx-auto flex justify-between items-center px-5 py-4">
        <Link href="/">
          <img src="/Wordmark.svg" alt="LinkLib Logo" className="h-[26px] w-auto" />
        </Link>
        <Link href="/" className="text-sm font-semibold text-primary hover:text-primary-hover transition-colors">
          Open App →
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 pt-8 pb-24 flex flex-col gap-10">
        <div>
          <h1 className="text-3xl font-bold mb-3">The LinkLib Save Button</h1>
          <p className="text-muted leading-relaxed m-0">
            Save videos, posts, articles, and more to your LinkLib library with one click —
            without copying URLs. Site owners can embed the button, and everyone else can
            use the bookmarklet.
          </p>
        </div>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">1. Embed the button on your website</h2>
          <p className="text-sm text-muted mb-4">
            Paste this snippet where you want the button to appear. It uses the LinkLib look
            and saves the current page automatically when clicked (or the URL provided via{" "}
            <code className="bg-slate-100 px-1 rounded">data-url</code>).
          </p>
          <CodeSnippet code={EMBED_SNIPPET} />
          <ul className="text-xs text-muted mt-4 flex flex-col gap-1.5 list-disc pl-4">
            <li><code className="bg-slate-100 px-1 rounded">data-url</code> - save a specific URL (default: current page)</li>
            <li><code className="bg-slate-100 px-1 rounded">data-title</code> - custom title (default: page title)</li>
            <li><code className="bg-slate-100 px-1 rounded">data-label</code> - text label next to the icon; omit for icon-only mode</li>
            <li><code className="bg-slate-100 px-1 rounded">data-size</code> - button height in pixels (default: 32)</li>
          </ul>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">2. Try it live</h2>
          <p className="text-sm text-muted mb-4">
            This is how the button looks — click it to open the save popup and add
            this page to your library:
          </p>
          <div className="flex items-center gap-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6 justify-center">
            <a href="/save" className="linklib-save-button" data-label="Save"></a>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold mb-2">3. Bookmarklet - for all other websites</h2>
          <p className="text-sm text-muted mb-4">
            Drag this button to your bookmarks bar. Then, on any website (YouTube, X, blogs, and more),
            click the bookmark to save the current page to LinkLib instantly:
          </p>
          <div className="flex justify-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-6">
            <BookmarkletLink />
          </div>
        </section>
      </main>
    </div>
  );
}
