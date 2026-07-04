import Link from "next/link";
import { localizePath, type AppLocale } from "@/lib/locale";
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

const CONTENT: Record<AppLocale, {
  featureHeadline: string;
  featureSubline: string;
  faqHeadline: string;
  faqSubline: string;
  features: typeof FEATURES;
  faqs: typeof FAQS;
}> = {
  de: {
    featureHeadline: "Alles, was deine Links brauchen",
    featureSubline:
      "LinkLib ist die übersichtliche Alternative zu unsortierten Browser-Lesezeichen – gebaut für Menschen, die viele Links sammeln.",
    faqHeadline: "Häufige Fragen",
    faqSubline: "Kurz beantwortet – alles Wichtige rund um deine Link-Bibliothek.",
    features: FEATURES,
    faqs: FAQS,
  },
  en: {
    featureHeadline: "Everything your links need",
    featureSubline:
      "LinkLib is the clean alternative to messy browser bookmarks, built for people who collect lots of links.",
    faqHeadline: "Frequently asked questions",
    faqSubline: "Quick answers to the most important questions about your link library.",
    features: [
      {
        icon: FolderOpen,
        title: "Tabs & folders",
        text: "Organize your links in tabs and color-coded folders, sorted with drag and drop just the way you think.",
      },
      {
        icon: ImageIcon,
        title: "Automatic previews",
        text: "Title, description, and preview image are loaded automatically when you save a link, no manual work needed.",
      },
      {
        icon: MousePointerClick,
        title: "Save button & bookmarklet",
        text: "Save links from any website in one click, no copy and paste required.",
        href: "/save-button",
        linkLabel: "Learn more about the Save button →",
      },
      {
        icon: Cloud,
        title: "Available everywhere",
        text: "Your library is stored securely in the cloud and synced across desktop, tablet, and phone.",
      },
      {
        icon: EyeOff,
        title: "Incognito tabs",
        text: "Private password-protected tabs keep sensitive links visible only to you.",
      },
      {
        icon: Sparkles,
        title: "Start for free",
        text: "All core features stay free forever, sign up in seconds and get started.",
      },
    ],
    faqs: [
      {
        question: "What is LinkLib?",
        answer:
          "LinkLib is a free online bookmark manager. Save links, videos, and articles in your personal library and organize everything neatly in tabs and folders, securely in the cloud.",
      },
      {
        question: "Is LinkLib really free?",
        answer:
          "Yes. All core features are free forever and funded by discreet ads. With LinkLib Premium, you can use the app ad-free and unlock extras like password-protected incognito tabs.",
      },
      {
        question: "Which devices support LinkLib?",
        answer:
          "LinkLib runs directly in your browser with no installation required. Your library syncs automatically across desktop, laptop, tablet, and phone.",
      },
      {
        question: "How do I save a link?",
        answer:
          "Just paste the URL and LinkLib automatically fetches title, description, and preview image. For even faster saving, use the Save button or bookmarklet to save links directly from any website.",
      },
      {
        question: "Is my data secure?",
        answer:
          "Yes. Your data is transmitted securely and processed in compliance with GDPR requirements. Private incognito tabs can be additionally protected with a password. See our privacy policy for details.",
      },
      {
        question: "Do I need a credit card?",
        answer:
          "No. To sign up, an email address or a Google/GitHub account is enough. Payment details are only needed if you choose to upgrade to Premium.",
      },
    ],
  },
};

export function LandingSections({ locale = "de" }: { locale?: AppLocale }) {
  const content = CONTENT[locale];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* FEATURES */}
      <section id="features" className="max-w-shell mx-auto px-5 py-20">
        <h2 className="text-3xl font-extrabold text-center mb-3">{content.featureHeadline}</h2>
        <p className="text-slate-500 text-center font-medium mb-12 max-w-2xl mx-auto">
          {content.featureSubline}
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/60 shadow-lg text-left"
            >
              <feature.icon className="w-8 h-8 text-primary mb-4" aria-hidden="true" />
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.text}</p>
              {feature.href && (
                <Link
                  href={localizePath(feature.href, locale)}
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
        <h2 className="text-3xl font-extrabold text-center mb-3">{content.faqHeadline}</h2>
        <p className="text-slate-500 text-center font-medium mb-10">
          {content.faqSubline}
        </p>
        <div className="flex flex-col gap-3">
          {content.faqs.map((faq) => (
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
