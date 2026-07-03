import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AGB | LinkLib",
  description: "Allgemeine Geschäftsbedingungen für die Nutzung von LinkLib und LinkLib Premium.",
  robots: { index: false, follow: true },
};

export default function AGB() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">1. Geltungsbereich und Anbieter</h2>
        <p className="mb-4">
          Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Website
          getlinklib.com (&quot;LinkLib&quot;) sowie für den Erwerb kostenpflichtiger
          Premium-Leistungen. Anbieter ist Sebastian Siebert, Josef-Kastl-Straße 4,
          82377 Penzberg, Deutschland (siehe{" "}
          <Link href="/impressum" className="text-primary hover:underline">Impressum</Link>).
          Das Angebot richtet sich an Verbraucher im Sinne des § 13 BGB.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">2. Leistungsbeschreibung</h2>
        <p className="mb-4">
          LinkLib ist ein cloudbasierter Dienst zum Speichern, Organisieren und Verwalten von
          Lesezeichen (Links). Die Basisnutzung ist kostenlos und wird durch Werbung finanziert.
          Mit &quot;LinkLib Premium&quot; kann der Dienst werbefrei genutzt werden. Premium ist
          als monatliches Abonnement, jährliches Abonnement oder als Einmalkauf
          (&quot;Lifetime&quot;) erhältlich.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">3. Registrierung und Nutzerkonto</h2>
        <p className="mb-4">
          Die Nutzung von LinkLib erfordert die Erstellung eines Nutzerkontos (per E-Mail und
          Passwort oder über die Anmeldung mit GitHub bzw. Google). Der Nutzer ist verpflichtet,
          seine Zugangsdaten geheim zu halten. Es besteht kein Anspruch auf Registrierung. Konten
          können vom Nutzer jederzeit in der Kontoverwaltung gelöscht werden.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">4. Vertragsschluss</h2>
        <p className="mb-4">
          Die Darstellung der Premium-Pläne auf der Website stellt kein rechtlich bindendes
          Angebot dar, sondern eine Aufforderung zur Abgabe einer Bestellung. Der Bestellprozess
          läuft wie folgt ab:
        </p>
        <ol className="list-decimal ml-6 mb-4 flex flex-col gap-1">
          <li>Auswahl des gewünschten Plans (monatlich, jährlich oder Lifetime) im Upgrade-Dialog.</li>
          <li>Weiterleitung zur gesicherten Bezahlseite unseres Zahlungsdienstleisters Stripe. Dort werden alle Bestelldaten und der Gesamtpreis nochmals angezeigt; Eingabefehler können bis zum Absenden korrigiert werden.</li>
          <li>Mit Klick auf den zahlungspflichtigen Bestell-Button gibt der Nutzer ein verbindliches Angebot zum Abschluss des Vertrags ab.</li>
          <li>Der Vertrag kommt zustande, wenn wir die Bestellung durch Freischaltung der Premium-Funktionen und/oder eine Bestätigungs-E-Mail annehmen.</li>
        </ol>
        <p className="mb-4">
          Vertragssprache ist Deutsch. Der Vertragstext wird von uns nicht dauerhaft gespeichert;
          die Bestelldaten werden dem Nutzer durch Stripe per E-Mail-Beleg zur Verfügung gestellt.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">5. Preise und Zahlung</h2>
        <p className="mb-4">
          Es gelten die zum Zeitpunkt der Bestellung angezeigten Preise. Als Kleinunternehmer im
          Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet und ausgewiesen. Die
          Zahlungsabwicklung erfolgt über den Zahlungsdienstleister Stripe; verfügbar sind die
          dort angebotenen Zahlungsarten (z. B. Kreditkarte). Abonnementgebühren werden im Voraus
          für den jeweiligen Abrechnungszeitraum fällig.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">6. Laufzeit und Kündigung von Abonnements</h2>
        <p className="mb-4">
          Monats- und Jahresabonnements verlängern sich automatisch um den jeweiligen
          Abrechnungszeitraum, sofern sie nicht vor Ablauf gekündigt werden. Die Kündigung ist
          jederzeit zum Ende des laufenden Abrechnungszeitraums möglich – direkt in der
          Kontoverwaltung über das Kundenportal von Stripe oder per E-Mail an{" "}
          <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>.
          Bereits gezahlte Entgelte für den laufenden Zeitraum werden nicht anteilig erstattet;
          Premium bleibt bis zum Ende des bezahlten Zeitraums aktiv. Der Lifetime-Plan ist ein
          Einmalkauf ohne Laufzeit. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund
          bleibt unberührt.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">7. Widerrufsrecht</h2>
        <p className="mb-4">
          Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten, die Belehrung und
          das Muster-Widerrufsformular finden Sie in der{" "}
          <Link href="/widerruf" className="text-primary hover:underline">Widerrufsbelehrung</Link>.
          Bitte beachten Sie: Verlangen Sie die sofortige Bereitstellung der Premium-Funktionen
          vor Ablauf der Widerrufsfrist, kann das Widerrufsrecht nach Maßgabe der gesetzlichen
          Regelungen erlöschen bzw. ist bei Widerruf Wertersatz für die bereits erbrachte
          Leistung zu zahlen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">8. Pflichten des Nutzers, unzulässige Nutzung</h2>
        <p className="mb-4">
          Der Nutzer darf den Dienst nicht missbräuchlich verwenden, insbesondere keine Links auf
          rechtswidrige Inhalte speichern oder verbreiten und keine Handlungen vornehmen, die die
          Funktionsfähigkeit des Dienstes beeinträchtigen. Bei schwerwiegenden oder wiederholten
          Verstößen können wir Konten sperren oder löschen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">9. Verfügbarkeit und Änderungen des Dienstes</h2>
        <p className="mb-4">
          Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit des Dienstes,
          schulden jedoch keine bestimmte Verfügbarkeit. Wartungsarbeiten, Weiterentwicklungen
          oder Störungen können zu vorübergehenden Einschränkungen führen. Wir empfehlen, für
          wichtige Links zusätzlich eigene Sicherungen (Export/Notizen) vorzuhalten.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">10. Haftung</h2>
        <p className="mb-4">
          Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der
          Verletzung des Lebens, des Körpers oder der Gesundheit. Bei einfacher Fahrlässigkeit
          haften wir nur für die Verletzung wesentlicher Vertragspflichten (Kardinalpflichten),
          begrenzt auf den vertragstypischen, vorhersehbaren Schaden. Die Haftung nach dem
          Produkthaftungsgesetz bleibt unberührt. Für Inhalte externer, von Nutzern gespeicherter
          Websites übernehmen wir keine Verantwortung.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">11. Streitbeilegung</h2>
        <p className="mb-4">
          Die EU-Plattform zur Online-Streitbeilegung (OS-Plattform) wurde zum 20. Juli 2025
          eingestellt. Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
          vor einer Verbraucherschlichtungsstelle im Sinne des § 36 VSBG teilzunehmen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">12. Schlussbestimmungen</h2>
        <p className="mb-4">
          Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
          Gegenüber Verbrauchern gilt diese Rechtswahl nur, soweit ihnen dadurch nicht der Schutz
          zwingender Bestimmungen des Rechts ihres gewöhnlichen Aufenthaltsstaats entzogen wird.
          Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der
          übrigen Bestimmungen unberührt.
        </p>

        <p className="mb-4 text-sm text-slate-500">Stand: Juli 2026</p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Zurück zur Startseite</Link>
          <Link href="/impressum" className="text-primary font-medium hover:underline">Impressum</Link>
          <Link href="/datenschutz" className="text-primary font-medium hover:underline">Datenschutzerklärung</Link>
          <Link href="/widerruf" className="text-primary font-medium hover:underline">Widerrufsbelehrung</Link>
        </div>
      </div>
    </div>
  );
}
