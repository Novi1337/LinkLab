import type { Metadata } from "next";
import Link from "next/link";
import type { AppLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Terms of Service | LinkLib" : "AGB | LinkLib",
    description:
      locale === "en"
        ? "Terms of service for using LinkLib and LinkLib Premium."
        : "Allgemeine Geschäftsbedingungen für die Nutzung von LinkLib und LinkLib Premium.",
    robots: { index: false, follow: true },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">
          {isEn ? "Terms of Service" : "Allgemeine Geschäftsbedingungen (AGB)"}
        </h1>

        <h2 className="text-xl font-bold mt-6 mb-2">1. {isEn ? "Scope and provider" : "Geltungsbereich und Anbieter"}</h2>
        <p className="mb-4">
          {isEn
            ? "These terms govern use of getlinklib.com (LinkLib) and the purchase of paid Premium services. The provider is Sebastian Siebert, Josef-Kastl-Straße 4, 82377 Penzberg, Germany (see Legal Notice)."
            : "Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Website getlinklib.com (LinkLib) sowie für den Erwerb kostenpflichtiger Premium-Leistungen. Anbieter ist Sebastian Siebert, Josef-Kastl-Straße 4, 82377 Penzberg, Deutschland (siehe Impressum)."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">2. {isEn ? "Service description" : "Leistungsbeschreibung"}</h2>
        <p className="mb-4">
          {isEn
            ? "LinkLib is a cloud service to save, organize, and manage bookmarks. The base plan is free and ad-supported. LinkLib Premium provides ad-free use and additional features."
            : "LinkLib ist ein cloudbasierter Dienst zum Speichern, Organisieren und Verwalten von Lesezeichen. Die Basisnutzung ist kostenlos und wird durch Werbung finanziert. Mit LinkLib Premium kann der Dienst werbefrei genutzt werden."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">3. {isEn ? "Registration and user account" : "Registrierung und Nutzerkonto"}</h2>
        <p className="mb-4">
          {isEn
            ? "Using LinkLib requires a user account (email/password or GitHub/Google login). Users must keep credentials confidential. There is no entitlement to registration."
            : "Die Nutzung von LinkLib erfordert die Erstellung eines Nutzerkontos (per E-Mail und Passwort oder über die Anmeldung mit GitHub bzw. Google). Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten. Es besteht kein Anspruch auf Registrierung."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">4. {isEn ? "Contract conclusion" : "Vertragsschluss"}</h2>
        <p className="mb-4">
          {isEn
            ? "Premium plans shown on the website are a non-binding invitation to place an order. The contract is concluded once Premium features are activated and/or confirmation is sent."
            : "Die Darstellung der Premium-Pläne auf der Website stellt kein rechtlich bindendes Angebot dar, sondern eine Aufforderung zur Abgabe einer Bestellung. Der Vertrag kommt zustande, wenn wir die Bestellung durch Freischaltung der Premium-Funktionen und/oder eine Bestätigungs-E-Mail annehmen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">5. {isEn ? "Prices and payment" : "Preise und Zahlung"}</h2>
        <p className="mb-4">
          {isEn
            ? "Prices shown at checkout apply. Payment processing is handled by Stripe and available payment methods are provided there."
            : "Es gelten die zum Zeitpunkt der Bestellung angezeigten Preise. Die Zahlungsabwicklung erfolgt über den Zahlungsdienstleister Stripe; verfügbar sind die dort angebotenen Zahlungsarten."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">6. {isEn ? "Term and cancellation" : "Laufzeit und Kündigung"}</h2>
        <p className="mb-4">
          {isEn
            ? "Monthly and yearly subscriptions renew automatically unless canceled before the end of the billing period. Cancellation is possible at any time effective at period end. Lifetime is a one-time purchase without renewal."
            : "Monats- und Jahresabonnements verlängern sich automatisch, sofern sie nicht vor Ablauf gekündigt werden. Die Kündigung ist jederzeit zum Ende des laufenden Abrechnungszeitraums möglich. Der Lifetime-Plan ist ein Einmalkauf ohne Laufzeit."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">7. {isEn ? "Right of withdrawal" : "Widerrufsrecht"}</h2>
        <p className="mb-4">
          {isEn
            ? "Consumers have a statutory right of withdrawal. Details and the model form are available in the withdrawal policy."
            : "Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Einzelheiten und das Muster-Widerrufsformular finden Sie in der Widerrufsbelehrung."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">8. {isEn ? "User obligations" : "Pflichten des Nutzers"}</h2>
        <p className="mb-4">
          {isEn
            ? "Users must not misuse the service, especially not for unlawful content. In case of severe or repeated violations, accounts may be suspended or deleted."
            : "Der Nutzer darf den Dienst nicht missbräuchlich verwenden, insbesondere keine rechtswidrigen Inhalte speichern oder verbreiten. Bei schwerwiegenden oder wiederholten Verstößen können wir Konten sperren oder löschen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">9. {isEn ? "Availability and changes" : "Verfügbarkeit und Änderungen"}</h2>
        <p className="mb-4">
          {isEn
            ? "We aim for high availability but do not guarantee uninterrupted operation. Maintenance and technical issues may cause temporary limitations."
            : "Wir bemühen uns um eine möglichst unterbrechungsfreie Verfügbarkeit des Dienstes, schulden jedoch keine bestimmte Verfügbarkeit. Wartungsarbeiten und Störungen können zu vorübergehenden Einschränkungen führen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">10. {isEn ? "Liability" : "Haftung"}</h2>
        <p className="mb-4">
          {isEn
            ? "We are fully liable in cases of intent, gross negligence, and injury to life/body/health. In cases of slight negligence, liability is limited to breaches of essential contractual obligations and foreseeable damage."
            : "Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit. Bei einfacher Fahrlässigkeit haften wir nur für die Verletzung wesentlicher Vertragspflichten, begrenzt auf den vertragstypischen, vorhersehbaren Schaden."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">11. {isEn ? "Dispute resolution" : "Streitbeilegung"}</h2>
        <p className="mb-4">
          {isEn
            ? "The EU ODR platform has been discontinued as of July 20, 2025. We are not willing and not obliged to participate in consumer arbitration proceedings."
            : "Die EU-Plattform zur Online-Streitbeilegung wurde zum 20. Juli 2025 eingestellt. Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">12. {isEn ? "Final provisions" : "Schlussbestimmungen"}</h2>
        <p className="mb-4">
          {isEn
            ? "German law applies, excluding the UN Convention on Contracts for the International Sale of Goods. Mandatory consumer protection provisions remain unaffected."
            : "Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Zwingende Verbraucherschutzbestimmungen bleiben unberührt."}
        </p>

        <p className="mb-4 text-sm text-slate-500">{isEn ? "Version: July 2026" : "Stand: Juli 2026"}</p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={localizePath("/", locale)} className="text-primary font-medium hover:underline">{isEn ? "← Back to home" : "← Zurück zur Startseite"}</Link>
          <Link href={localizePath("/impressum", locale)} className="text-primary font-medium hover:underline">{isEn ? "Legal notice" : "Impressum"}</Link>
          <Link href={localizePath("/datenschutz", locale)} className="text-primary font-medium hover:underline">{isEn ? "Privacy policy" : "Datenschutzerklärung"}</Link>
          <Link href={localizePath("/widerruf", locale)} className="text-primary font-medium hover:underline">{isEn ? "Right of withdrawal" : "Widerrufsbelehrung"}</Link>
        </div>
      </div>
    </div>
  );
}
