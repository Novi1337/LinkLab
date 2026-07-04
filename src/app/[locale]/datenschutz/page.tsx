import type { Metadata } from "next";
import Link from "next/link";
import type { AppLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Privacy Policy | LinkLib" : "Datenschutzerklärung | LinkLib",
    description:
      locale === "en"
        ? "Information on how LinkLib processes personal data."
        : "Informationen zur Verarbeitung personenbezogener Daten bei LinkLib gemäß DSGVO.",
    robots: { index: false, follow: true },
  };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">{isEn ? "Privacy Policy" : "Datenschutzerklärung"}</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">1. {isEn ? "Controller" : "Verantwortlicher"}</h2>
        <p className="mb-4">
          {isEn
            ? "The controller within the meaning of the GDPR is:"
            : "Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:"}
        </p>
        <p className="mb-4 pl-4 border-l-2 border-slate-200">
          Sebastian Siebert
          <br />
          Josef-Kastl-Straße 4
          <br />
          82377 Penzberg, {isEn ? "Germany" : "Deutschland"}
          <br />
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">2. {isEn ? "General data processing" : "Allgemeines zur Datenverarbeitung"}</h2>
        <p className="mb-4">
          {isEn
            ? "We process personal data only to the extent required to provide our service or where you have consented. Legal bases are in particular Art. 6(1)(a) GDPR (consent), Art. 6(1)(b) GDPR (contract), and Art. 6(1)(f) GDPR (legitimate interests). Data is deleted when processing purposes cease and no legal retention obligations apply."
            : "Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung unseres Dienstes erforderlich ist oder Sie eingewilligt haben. Rechtsgrundlagen sind insbesondere Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), lit. b DSGVO (Vertragserfüllung) und lit. f DSGVO (berechtigtes Interesse). Daten werden gelöscht, sobald der Zweck der Verarbeitung entfällt und keine gesetzlichen Aufbewahrungspflichten entgegenstehen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">3. Hosting (Vercel)</h2>
        <p className="mb-4">
          {isEn
            ? "Our website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Vercel processes technically necessary data (IP address, timestamp, requested page, browser type) in server logs to deliver and secure the website (Art. 6(1)(f) GDPR). A data processing agreement is in place. Transfers to the US are based on SCCs and/or the EU-US Data Privacy Framework."
            : "Unsere Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, gehostet. Beim Aufruf der Website verarbeitet Vercel technisch notwendige Daten (IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Browsertyp) in sogenannten Server-Logs, um die Website auszuliefern und die Sicherheit und Stabilität zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Mit Vercel besteht ein Auftragsverarbeitungsvertrag; eine Übermittlung in die USA erfolgt auf Grundlage der EU-Standardvertragsklauseln bzw. des EU-US Data Privacy Framework."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">4. {isEn ? "Registration and account (Supabase)" : "Registrierung und Nutzerkonto (Supabase)"}</h2>
        <p className="mb-4">
          {isEn
            ? "Using LinkLib requires an account. We use Supabase for authentication and data storage. Our database is hosted in the EU (Frankfurt region). We process your email address, password hash, and saved content (legal basis: Art. 6(1)(b) GDPR)."
            : "Für die Nutzung von LinkLib ist ein Nutzerkonto erforderlich. Zur Authentifizierung und Datenspeicherung nutzen wir Supabase (Supabase Inc.). Unsere Datenbank wird in einem Rechenzentrum in der EU (Region Frankfurt) betrieben. Verarbeitet werden Ihre E-Mail-Adresse, ein Passwort-Hash sowie die von Ihnen gespeicherten Inhalte (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung)."}
        </p>
        <p className="mb-4">
          {isEn
            ? "You can also sign in via GitHub (GitHub, Inc.) or Google (Google Ireland Limited). In this case we receive your email address and user identifier from the provider. Data processing by the login provider is governed by that provider's privacy policy."
            : "Alternativ können Sie sich über GitHub (GitHub, Inc.) oder Google (Google Ireland Limited) anmelden. Dabei erhalten wir vom jeweiligen Anbieter Ihre E-Mail-Adresse und eine Nutzerkennung. Für die Verarbeitung durch den Login-Anbieter gilt dessen Datenschutzerklärung."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">5. {isEn ? "Saved links and content" : "Gespeicherte Links und Inhalte"}</h2>
        <p className="mb-4">
          {isEn
            ? "Saved links, sections, and tabs are stored in our database to provide the service (Art. 6(1)(b) GDPR). When adding a link, our servers fetch metadata from the target page (title, description, preview image). You can delete links, sections, or your full account at any time."
            : "Die von Ihnen gespeicherten Links, Sektionen und Tabs werden zur Bereitstellung des Dienstes in unserer Datenbank gespeichert (Art. 6 Abs. 1 lit. b DSGVO). Beim Hinzufügen eines Links rufen unsere Server Metadaten der Zielseite ab (Titel, Beschreibung, Vorschaubild), um Ihnen eine Vorschau anzuzeigen. Sie können Links, Sektionen und Ihr gesamtes Konto jederzeit selbst löschen; mit der Kontolöschung werden alle zugehörigen Daten entfernt."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">6. {isEn ? "Profiling (only with consent)" : "Auswertung von Link-Daten und Profiling (nur mit Einwilligung)"}</h2>
        <p className="mb-4">
          {isEn
            ? "If you consent to personalized advertising, we analyze saved content (titles, domains, section names) to derive interest categories (profiling, Art. 6(1)(a) GDPR). These profiles are used for ad targeting and may partially be shared with ad networks (such as Google AdSense). You can withdraw consent at any time via Cookie Settings in the footer."
            : "Wenn Sie über den Cookie-Banner in personalisierte Werbung einwilligen, analysieren wir die von Ihnen gespeicherten Inhalte (Titel, Domains und Sektions-Namen der hinzugefügten Links) und leiten daraus Interessens-Kategorien ab (Profiling, Art. 6 Abs. 1 lit. a DSGVO). Diese Interessensprofile werden verwendet, um Werbeanzeigen auf unserer Website gezielt auf Sie zuzuschneiden, und fließen teilweise in Werbenetzwerke (wie Google AdSense) ein. Ohne Ihre Einwilligung findet keine solche Auswertung statt. Sie können die Einwilligung jederzeit über den Link Cookie-Einstellungen im Seitenfuß mit Wirkung für die Zukunft widerrufen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">7. Google AdSense</h2>
        <p className="mb-4">
          {isEn
            ? "If you consent (Art. 6(1)(a) GDPR, Section 25(1) TDDDG), we display ads via Google AdSense (Google Ireland Limited, Dublin, Ireland). Google uses cookies and similar technologies for interest-based ads and performance measurement. Data may be transferred to Google LLC servers in the US (SCCs / EU-US DPF). Without consent, AdSense scripts are not loaded."
            : "Sofern Sie eingewilligt haben (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG), binden wir Werbeanzeigen über Google AdSense ein, einen Dienst der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland. Google verwendet Cookies und ähnliche Technologien, um interessenbezogene Werbung anzuzeigen und Anzeigenleistung zu messen. Dabei können Daten an Server der Google LLC in den USA übertragen werden (Grundlage: EU-Standardvertragsklauseln / EU-US Data Privacy Framework). Ohne Einwilligung werden keine AdSense-Skripte geladen."}
          {" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">policies.google.com/privacy</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">8. {isEn ? "Payment processing (Stripe)" : "Zahlungsabwicklung (Stripe)"}</h2>
        <p className="mb-4">
          {isEn
            ? "For Premium purchases we use Stripe (Stripe Payments Europe, Ltd., Dublin, Ireland). During checkout you are redirected to Stripe, which processes payment data under its own responsibility. We only receive payment/subscription status data (Art. 6(1)(b) GDPR)."
            : "Für den Kauf von LinkLib Premium nutzen wir den Zahlungsdienstleister Stripe (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin, Irland). Bei einem Kauf werden Sie auf die Bezahlseite von Stripe weitergeleitet; Stripe verarbeitet dort die von Ihnen eingegebenen Zahlungsdaten (z. B. Kreditkartendaten) in eigener Verantwortung. Wir erhalten von Stripe lediglich Informationen über den Status Ihrer Zahlung und Ihres Abonnements (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO)."}
          {" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">stripe.com/privacy</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">9. {isEn ? "Cookies and local storage" : "Cookies und lokale Speicherung"}</h2>
        <p className="mb-4">
          {isEn
            ? "We use technically necessary storage technologies (Section 25(2) TDDDG), for example to store login sessions and cookie choices. Non-essential cookies (especially ad cookies) are set only with your consent (Section 25(1) TDDDG, Art. 6(1)(a) GDPR)."
            : "Wir setzen technisch notwendige Speichertechnologien ein (§ 25 Abs. 2 TDDDG), z. B. zur Speicherung Ihrer Login-Sitzung und Ihrer Cookie-Entscheidung im LocalStorage. Nicht notwendige Cookies (insbesondere Werbe-Cookies) werden ausschließlich nach Ihrer Einwilligung gesetzt (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO)."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">10. {isEn ? "Your rights" : "Ihre Rechte"}</h2>
        <ul className="list-disc ml-6 mb-4 flex flex-col gap-1">
          <li>{isEn ? "Right of access (Art. 15 GDPR)" : "Recht auf Auskunft (Art. 15 DSGVO)"}</li>
          <li>{isEn ? "Right to rectification (Art. 16 GDPR)" : "Recht auf Berichtigung (Art. 16 DSGVO)"}</li>
          <li>{isEn ? "Right to erasure (Art. 17 GDPR)" : "Recht auf Löschung (Art. 17 DSGVO)"}</li>
          <li>{isEn ? "Right to restriction (Art. 18 GDPR)" : "Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)"}</li>
          <li>{isEn ? "Right to data portability (Art. 20 GDPR)" : "Recht auf Datenübertragbarkeit (Art. 20 DSGVO)"}</li>
          <li>{isEn ? "Right to object (Art. 21 GDPR)" : "Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)"}</li>
          <li>{isEn ? "Right to withdraw consent (Art. 7(3) GDPR)" : "Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO)"}</li>
        </ul>
        <p className="mb-4">
          {isEn ? "To exercise your rights, send an email to " : "Zur Ausübung Ihrer Rechte genügt eine E-Mail an "}
          <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">11. {isEn ? "Data and account deletion" : "Löschung von Daten und Konto"}</h2>
        <p className="mb-4">
          {isEn
            ? "You can delete your account and all saved links at any time in account settings. Data is deleted promptly unless legal retention obligations apply (for example invoice records)."
            : "Sie können Ihr Konto einschließlich aller gespeicherten Links jederzeit selbst in der Kontoverwaltung löschen. Mit der Löschung werden Ihre Daten unverzüglich aus unserer Datenbank entfernt, soweit keine gesetzlichen Aufbewahrungspflichten bestehen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">12. {isEn ? "Data security" : "Datensicherheit"}</h2>
        <p className="mb-4">
          {isEn
            ? "All data is transmitted using HTTPS/TLS. Passwords are stored as hashes only. We apply appropriate technical and organizational measures to protect your data against loss and unauthorized access."
            : "Die Übertragung aller Daten erfolgt verschlüsselt über HTTPS/TLS. Passwörter werden ausschließlich als Hash gespeichert. Wir treffen angemessene technische und organisatorische Maßnahmen, um Ihre Daten gegen Verlust und unbefugten Zugriff zu schützen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">13. {isEn ? "Changes to this policy" : "Änderungen dieser Datenschutzerklärung"}</h2>
        <p className="mb-4">
          {isEn
            ? "We update this privacy policy when changes to our service or legal requirements make this necessary. The current version published here applies."
            : "Wir passen diese Datenschutzerklärung an, sobald Änderungen an unserem Dienst oder der Rechtslage dies erfordern. Es gilt jeweils die hier veröffentlichte aktuelle Fassung."}
        </p>

        <p className="mb-4 text-sm text-slate-500">{isEn ? "Version: July 2026" : "Stand: Juli 2026"}</p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={localizePath("/", locale)} className="text-primary font-medium hover:underline">{isEn ? "← Back to home" : "← Zurück zur Startseite"}</Link>
          <Link href={localizePath("/impressum", locale)} className="text-primary font-medium hover:underline">{isEn ? "Legal notice" : "Impressum"}</Link>
          <Link href={localizePath("/agb", locale)} className="text-primary font-medium hover:underline">{isEn ? "Terms" : "AGB"}</Link>
          <Link href={localizePath("/widerruf", locale)} className="text-primary font-medium hover:underline">{isEn ? "Right of withdrawal" : "Widerrufsbelehrung"}</Link>
        </div>
      </div>
    </div>
  );
}
