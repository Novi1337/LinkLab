import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto prose prose-slate">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Datenschutzerklärung</h1>
        
        <h2 className="text-xl font-bold mt-6 mb-2">1. Einleitung</h2>
        <p className="mb-4">Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>

        <h2 className="text-xl font-bold mt-6 mb-2">2. Auswertung von Link-Daten & Profiling</h2>
        <p className="mb-4">Wenn Sie der Nutzung von personalisierter Werbung zustimmen, analysieren wir die von Ihnen gespeicherten Inhalte (Titel, Domains und Sektions-Namen der hinzugefügten Links). Aus diesen Daten leiten wir Interessens-Kategorien (Profiling) ab.</p>
        <p className="mb-4">Diese Interessensprofile werden verwendet, um Werbeanzeigen auf unserer Website gezielt auf Sie zuzuschneiden. Diese Profile fließen auch teilweise in Werbenetzwerke (wie Google AdSense) ein.</p>

        <h2 className="text-xl font-bold mt-6 mb-2">3. Google AdSense</h2>
        <p className="mb-4">Diese Website verwendet Google AdSense, einen Dienst zum Einbinden von Werbeanzeigen der Google Inc. (&quot;Google&quot;). Google AdSense verwendet sogenannte &quot;Cookies&quot;, Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Website ermöglichen.</p>

        <h2 className="text-xl font-bold mt-6 mb-2">4. Widerruf & Löschung</h2>
        <p className="mb-4">Sie haben jederzeit das Recht, Ihre Einwilligung zur Auswertung Ihrer Daten zu widerrufen. Sie können Ihre gespeicherten Links vollständig aus der Datenbank löschen, indem Sie Ihren Account oder die Sektionen über das Interface entfernen.</p>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <Link href="/" className="text-primary font-medium hover:underline">← Zurück zur Startseite</Link>
        </div>
      </div>
    </div>
  );
}
