import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum | LinkLib",
  description: "Impressum und Anbieterkennzeichnung von LinkLib.",
  robots: { index: false, follow: true },
};

export default function Impressum() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Impressum</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">Angaben gemäß § 5 DDG</h2>
        <p className="mb-4">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg<br />
          Deutschland
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Kontakt</h2>
        <p className="mb-4">
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Umsatzsteuer</h2>
        <p className="mb-4">
          Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet
          und ausgewiesen.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV</h2>
        <p className="mb-4">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Verbraucherstreitbeilegung / Online-Streitbeilegung</h2>
        <p className="mb-4">
          Die Europäische Kommission hat die Plattform zur Online-Streitbeilegung (OS-Plattform)
          zum 20. Juli 2025 eingestellt; eine Beschwerdeeinreichung über diese Plattform ist nicht
          mehr möglich.
        </p>
        <p className="mb-4">
          Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle im Sinne des § 36 VSBG teilzunehmen. Bei Fragen oder
          Problemen erreichen Sie uns direkt unter der oben angegebenen E-Mail-Adresse.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Haftung für Links</h2>
        <p className="mb-4">
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen
          Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr
          übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder
          Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der
          Verlinkung auf mögliche Rechtsverstöße überprüft; rechtswidrige Inhalte waren zum
          Zeitpunkt der Verlinkung nicht erkennbar. Bei Bekanntwerden von Rechtsverletzungen
          werden wir derartige Links umgehend entfernen. Von Nutzern gespeicherte Links sind
          private Inhalte der jeweiligen Nutzer und werden von uns nicht redaktionell geprüft.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Zurück zur Startseite</Link>
          <Link href="/datenschutz" className="text-primary font-medium hover:underline">Datenschutzerklärung</Link>
          <Link href="/agb" className="text-primary font-medium hover:underline">AGB</Link>
          <Link href="/widerruf" className="text-primary font-medium hover:underline">Widerrufsbelehrung</Link>
        </div>
      </div>
    </div>
  );
}
