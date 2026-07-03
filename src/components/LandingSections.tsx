import Link from "next/link";
import {
  Cloud,
  EyeOff,
  FolderOpen,
  Image as ImageIcon,
  MousePointerClick,
  Sparkles,
} from "lucide-react";

// Servergerenderte (prerenderte) Landing-Inhalte für ausgeloggte Besucher
// und Suchmaschinen-Crawler: Features + FAQ inkl. Schema.org-FAQPage.

const FEATURES = [
  {
    icon: FolderOpen,
    title: "Reiter & Ordner",
    text: "Organisiere deine Links in Reitern und farbigen Ordnern – sortiert per Drag & Drop, genau wie du denkst.",
  },
  {
    icon: ImageIcon,
    title: "Automatische Vorschauen",
    text: "Titel, Beschreibung und Vorschaubild werden beim Speichern automatisch geladen – kein manuelles Ausfüllen.",
  },
  {
    icon: MousePointerClick,
    title: "Save-Button & Bookmarklet",
    text: "Speichere Links von jeder Website mit einem Klick – ganz ohne Kopieren und Einfügen.",
    href: "/save-button",
    linkLabel: "Mehr zum Save-Button →",
  },
  {
    icon: Cloud,
    title: "Überall verfügbar",
    text: "Deine Bibliothek liegt sicher in der Cloud und ist auf PC, Tablet und Smartphone immer synchron.",
  },
  {
    icon: EyeOff,
    title: "Inkognito-Reiter",
    text: "Private Reiter mit Passwortschutz: Sensible Links bleiben ausschließlich für dich sichtbar.",
  },
  {
    icon: Sparkles,
    title: "Kostenlos starten",
    text: "Alle Grundfunktionen sind dauerhaft kostenlos – registriere dich in wenigen Sekunden und leg los.",
  },
];

const FAQS = [
  {
    question: "Was ist LinkLib?",
    answer:
      "LinkLib ist ein kostenloser Online-Bookmark-Manager. Du speicherst Links, Videos und Artikel in einer persönlichen Link-Bibliothek und organisierst sie übersichtlich in Reitern und Ordnern – sicher in der Cloud.",
  },
  {
    question: "Ist LinkLib wirklich kostenlos?",
    answer:
      "Ja. Alle Grundfunktionen sind dauerhaft kostenlos und werden über dezente Werbung finanziert. Mit LinkLib Premium nutzt du die App werbefrei und erhältst Zusatzfunktionen wie passwortgeschützte Inkognito-Reiter.",
  },
  {
    question: "Auf welchen Geräten funktioniert LinkLib?",
    answer:
      "LinkLib läuft direkt im Browser – ganz ohne Installation. Deine Link-Bibliothek synchronisiert sich automatisch zwischen PC, Laptop, Tablet und Smartphone.",
  },
  {
    question: "Wie speichere ich einen Link?",
    answer:
      "Füge einfach die URL ein – Titel, Beschreibung und Vorschaubild werden automatisch geladen. Noch schneller geht es mit dem Save-Button oder Bookmarklet, mit dem du Links direkt von jeder Website mit einem Klick speicherst.",
  },
  {
    question: "Sind meine Daten sicher?",
    answer:
      "Ja. Deine Daten werden verschlüsselt übertragen und DSGVO-konform verarbeitet. Private Inkognito-Reiter lassen sich zusätzlich mit einem Passwort schützen. Details findest du in unserer Datenschutzerklärung.",
  },
  {
    question: "Brauche ich eine Kreditkarte?",
    answer:
      "Nein. Für die Registrierung genügt eine E-Mail-Adresse oder ein Google- bzw. GitHub-Konto. Zahlungsdaten sind nur für das optionale Premium-Upgrade nötig.",
  },
];

// Schema.org FAQPage für Google Rich Results – aus denselben Daten generiert,
// damit sichtbarer Inhalt und strukturierte Daten garantiert übereinstimmen.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export function LandingSections() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* FEATURES */}
      <section id="features" className="max-w-shell mx-auto px-5 py-20">
        <h2 className="text-3xl font-extrabold text-center mb-3">
          Alles, was deine Links brauchen
        </h2>
        <p className="text-slate-500 text-center font-medium mb-12 max-w-2xl mx-auto">
          LinkLib ist die übersichtliche Alternative zu unsortierten Browser-Lesezeichen –
          gebaut für Menschen, die viele Links sammeln.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg text-left"
            >
              <feature.icon className="w-8 h-8 text-primary mb-4" aria-hidden="true" />
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.text}</p>
              {feature.href && (
                <Link
                  href={feature.href}
                  className="inline-block mt-3 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
                >
                  {feature.linkLabel}
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-5 pb-20">
        <h2 className="text-3xl font-extrabold text-center mb-3">Häufige Fragen</h2>
        <p className="text-slate-500 text-center font-medium mb-10">
          Kurz beantwortet – alles Wichtige rund um deine Link-Bibliothek.
        </p>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group bg-white/80 backdrop-blur-md rounded-2xl border border-white/60 shadow-md open:shadow-lg transition-shadow"
            >
              <summary className="cursor-pointer list-none px-6 py-4 font-bold flex items-center justify-between gap-4 text-left">
                {faq.question}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-primary transition-transform group-open:rotate-45 text-xl leading-none"
                >
                  +
                </span>
              </summary>
              <p className="px-6 pb-5 text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
