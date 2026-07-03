import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | LinkLib",
  description: "Informationen zur Verarbeitung personenbezogener Daten bei LinkLib gemäß DSGVO.",
  robots: { index: false, follow: true },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Datenschutzerklärung</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">1. Verantwortlicher</h2>
        <p className="mb-4">
          Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:
        </p>
        <p className="mb-4 pl-4 border-l-2 border-slate-200">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg, Deutschland<br />
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">2. Allgemeines zur Datenverarbeitung</h2>
        <p className="mb-4">
          Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst und verarbeiten
          personenbezogene Daten nur, soweit dies zur Bereitstellung unseres Dienstes
          erforderlich ist oder Sie eingewilligt haben. Rechtsgrundlagen sind insbesondere
          Art. 6 Abs. 1 lit. a DSGVO (Einwilligung), lit. b DSGVO (Vertragserfüllung) und
          lit. f DSGVO (berechtigtes Interesse). Daten werden gelöscht, sobald der Zweck der
          Verarbeitung entfällt und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">3. Hosting (Vercel)</h2>
        <p className="mb-4">
          Unsere Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA,
          gehostet. Beim Aufruf der Website verarbeitet Vercel technisch notwendige Daten
          (IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite, Browsertyp) in
          sogenannten Server-Logs, um die Website auszuliefern und die Sicherheit und Stabilität
          zu gewährleisten (Art. 6 Abs. 1 lit. f DSGVO). Mit Vercel besteht ein
          Auftragsverarbeitungsvertrag; eine Übermittlung in die USA erfolgt auf Grundlage der
          EU-Standardvertragsklauseln bzw. des EU-US Data Privacy Framework.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">4. Registrierung und Nutzerkonto (Supabase)</h2>
        <p className="mb-4">
          Für die Nutzung von LinkLib ist ein Nutzerkonto erforderlich. Zur Authentifizierung
          und Datenspeicherung nutzen wir Supabase (Supabase Inc.). Unsere Datenbank wird in
          einem Rechenzentrum in der EU (Region Frankfurt) betrieben. Verarbeitet werden Ihre
          E-Mail-Adresse, ein Passwort-Hash sowie die von Ihnen gespeicherten Inhalte
          (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO – Vertragserfüllung).
        </p>
        <p className="mb-4">
          Alternativ können Sie sich über GitHub (GitHub, Inc.) oder Google (Google Ireland
          Limited) anmelden. Dabei erhalten wir vom jeweiligen Anbieter Ihre E-Mail-Adresse und
          eine Nutzerkennung. Für die Verarbeitung durch den Login-Anbieter gilt dessen
          Datenschutzerklärung.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">5. Gespeicherte Links und Inhalte</h2>
        <p className="mb-4">
          Die von Ihnen gespeicherten Links, Sektionen und Tabs werden zur Bereitstellung des
          Dienstes in unserer Datenbank gespeichert (Art. 6 Abs. 1 lit. b DSGVO). Beim
          Hinzufügen eines Links rufen unsere Server Metadaten der Zielseite ab (Titel,
          Beschreibung, Vorschaubild), um Ihnen eine Vorschau anzuzeigen. Sie können Links,
          Sektionen und Ihr gesamtes Konto jederzeit selbst löschen; mit der Kontolöschung
          werden alle zugehörigen Daten entfernt.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">6. Auswertung von Link-Daten und Profiling (nur mit Einwilligung)</h2>
        <p className="mb-4">
          Wenn Sie über den Cookie-Banner in personalisierte Werbung einwilligen, analysieren
          wir die von Ihnen gespeicherten Inhalte (Titel, Domains und Sektions-Namen der
          hinzugefügten Links) und leiten daraus Interessens-Kategorien ab (Profiling,
          Art. 6 Abs. 1 lit. a DSGVO). Diese Interessensprofile werden verwendet, um
          Werbeanzeigen auf unserer Website gezielt auf Sie zuzuschneiden, und fließen teilweise
          in Werbenetzwerke (wie Google AdSense) ein. Ohne Ihre Einwilligung findet keine solche
          Auswertung statt. Sie können die Einwilligung jederzeit über den Link
          &quot;Cookie-Einstellungen&quot; im Seitenfuß mit Wirkung für die Zukunft widerrufen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">7. Google AdSense</h2>
        <p className="mb-4">
          Sofern Sie eingewilligt haben (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG), binden
          wir Werbeanzeigen über Google AdSense ein, einen Dienst der Google Ireland Limited,
          Gordon House, Barrow Street, Dublin 4, Irland. Google verwendet Cookies und ähnliche
          Technologien, um interessenbezogene Werbung anzuzeigen und Anzeigenleistung zu messen.
          Dabei können Daten an Server der Google LLC in den USA übertragen werden (Grundlage:
          EU-Standardvertragsklauseln / EU-US Data Privacy Framework). Ohne Einwilligung werden
          keine AdSense-Skripte geladen. Weitere Informationen:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">policies.google.com/privacy</a>.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">8. Zahlungsabwicklung (Stripe)</h2>
        <p className="mb-4">
          Für den Kauf von LinkLib Premium nutzen wir den Zahlungsdienstleister Stripe (Stripe
          Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin, Irland). Bei einem Kauf
          werden Sie auf die Bezahlseite von Stripe weitergeleitet; Stripe verarbeitet dort die
          von Ihnen eingegebenen Zahlungsdaten (z. B. Kreditkartendaten) in eigener
          Verantwortung. Wir erhalten von Stripe lediglich Informationen über den Status Ihrer
          Zahlung und Ihres Abonnements (Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO). Weitere
          Informationen:{" "}
          <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">stripe.com/de/privacy</a>.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">9. Cookies und lokale Speicherung</h2>
        <p className="mb-4">
          Wir setzen technisch notwendige Speichertechnologien ein (§ 25 Abs. 2 TDDDG), z. B.
          zur Speicherung Ihrer Login-Sitzung (Supabase Auth) und Ihrer Cookie-Entscheidung im
          LocalStorage Ihres Browsers. Nicht notwendige Cookies (insbesondere Werbe-Cookies von
          Google AdSense) werden ausschließlich nach Ihrer Einwilligung über den Cookie-Banner
          gesetzt (§ 25 Abs. 1 TDDDG, Art. 6 Abs. 1 lit. a DSGVO). Ihre Auswahl können Sie
          jederzeit über &quot;Cookie-Einstellungen&quot; im Seitenfuß ändern.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">10. Ihre Rechte</h2>
        <p className="mb-4">Sie haben gegenüber uns folgende Rechte hinsichtlich Ihrer personenbezogenen Daten:</p>
        <ul className="list-disc ml-6 mb-4 flex flex-col gap-1">
          <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
          <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
          <li>Recht auf Löschung (Art. 17 DSGVO)</li>
          <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
          <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
          <li>Recht auf Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
          <li>Recht, eine erteilte Einwilligung jederzeit mit Wirkung für die Zukunft zu widerrufen (Art. 7 Abs. 3 DSGVO)</li>
        </ul>
        <p className="mb-4">
          Zur Ausübung Ihrer Rechte genügt eine E-Mail an{" "}
          <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>.
          Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren
          (Art. 77 DSGVO). Für uns zuständig ist das Bayerische Landesamt für Datenschutzaufsicht
          (BayLDA), Promenade 18, 91522 Ansbach.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">11. Löschung von Daten und Konto</h2>
        <p className="mb-4">
          Sie können Ihr Konto einschließlich aller gespeicherten Links jederzeit selbst in der
          Kontoverwaltung löschen. Mit der Löschung werden Ihre Daten unverzüglich aus unserer
          Datenbank entfernt, soweit keine gesetzlichen Aufbewahrungspflichten (z. B. für
          Zahlungsbelege) bestehen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">12. Datensicherheit</h2>
        <p className="mb-4">
          Die Übertragung aller Daten erfolgt verschlüsselt über HTTPS/TLS. Passwörter werden
          ausschließlich als Hash gespeichert. Wir treffen angemessene technische und
          organisatorische Maßnahmen, um Ihre Daten gegen Verlust und unbefugten Zugriff zu
          schützen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">13. Änderungen dieser Datenschutzerklärung</h2>
        <p className="mb-4">
          Wir passen diese Datenschutzerklärung an, sobald Änderungen an unserem Dienst oder der
          Rechtslage dies erfordern. Es gilt jeweils die hier veröffentlichte aktuelle Fassung.
        </p>

        <p className="mb-4 text-sm text-slate-500">Stand: Juli 2026</p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Zurück zur Startseite</Link>
          <Link href="/impressum" className="text-primary font-medium hover:underline">Impressum</Link>
          <Link href="/agb" className="text-primary font-medium hover:underline">AGB</Link>
          <Link href="/widerruf" className="text-primary font-medium hover:underline">Widerrufsbelehrung</Link>
        </div>
      </div>
    </div>
  );
}
