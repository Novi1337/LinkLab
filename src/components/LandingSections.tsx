import Link from "next/link";
import {
  Cloud,
  EyeOff,
  FolderOpen,
  Image as ImageIcon,
  MousePointerClick,
  Sparkles,
} from "lucide-react";

// Server-rendered landing content for signed-out visitors and search crawlers:
// features + FAQ including Schema.org FAQPage.

const FEATURES = [
  {
    icon: FolderOpen,
    title: "Tabs & Folders",
    text: "Organize your links in tabs and color-coded folders, arranged with intuitive drag and drop.",
  },
  {
    icon: ImageIcon,
    title: "Automatic Previews",
    text: "Titles, descriptions, and preview images are fetched automatically when you save a link — no manual entry required.",
  },
  {
    icon: MousePointerClick,
    title: "Save-Button & Bookmarklet",
    text: "Save links from any website with a single click, without copying and pasting URLs.",
    href: "/save-button",
    linkLabel: "Learn more about the Save Button →",
  },
  {
    icon: Cloud,
    title: "Available Everywhere",
    text: "Your library is securely stored in the cloud and stays in sync across desktop, tablet, and mobile.",
  },
  {
    icon: EyeOff,
    title: "Incognito Tabs",
    text: "Password-protected private tabs keep sensitive links visible only to you.",
  },
  {
    icon: Sparkles,
    title: "Start for Free",
    text: "All core features are permanently free — create your account in seconds and get started right away.",
  },
];

const FAQS = [
  {
    question: "What is LinkLib?",
    answer:
      "LinkLib is a free online bookmark manager. Save links, videos, and articles in your personal library and keep everything organized in tabs and folders, securely stored in the cloud.",
  },
  {
    question: "Is LinkLib really free?",
    answer:
      "Yes. All core features are permanently free and supported by unobtrusive ads. With LinkLib Premium, you can use the app ad-free and unlock advanced features like password-protected Incognito tabs.",
  },
  {
    question: "Which devices support LinkLib?",
    answer:
      "LinkLib runs directly in your browser with no installation required. Your link library syncs automatically across desktop, laptop, tablet, and smartphone.",
  },
  {
    question: "How do I save a link?",
    answer:
      "Just paste the URL — title, description, and preview image are loaded automatically. For an even faster workflow, use the Save Button or bookmarklet to save links directly from any website in one click.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. Your data is transmitted securely and processed in compliance with GDPR. Private Incognito tabs can also be protected with a password. You can find full details in our Privacy Policy.",
  },
  {
    question: "Do I need a credit card?",
    answer:
      "No. You can register with an email address or a Google/GitHub account. Payment details are only required for optional Premium upgrades.",
  },
];

// Schema.org FAQPage for Google Rich Results, generated from the same data
// to ensure visible content and structured data always match.
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
          Everything your links need
        </h2>
        <p className="text-slate-500 text-center font-medium mb-12 max-w-2xl mx-auto">
          LinkLib is the structured alternative to cluttered browser bookmarks —
          built for people who collect lots of links.
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
        <h2 className="text-3xl font-extrabold text-center mb-3">Frequently Asked Questions</h2>
        <p className="text-slate-500 text-center font-medium mb-10">
          Quick answers to everything important about your link library.
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
