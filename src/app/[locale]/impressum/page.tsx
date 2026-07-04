import type { Metadata } from "next";
import Link from "next/link";
import type { AppLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Legal Notice | LinkLib" : "Impressum | LinkLib",
    description:
      locale === "en"
        ? "Legal notice and provider information for LinkLib."
        : "Impressum und Anbieterkennzeichnung von LinkLib.",
    robots: { index: false, follow: true },
  };
}

export default async function ImpressumPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">{isEn ? "Legal Notice" : "Impressum"}</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">{isEn ? "Information pursuant to Section 5 DDG" : "Angaben gemäß § 5 DDG"}</h2>
        <p className="mb-4">
          Sebastian Siebert
          <br />
          Josef-Kastl-Straße 4
          <br />
          82377 Penzberg
          <br />
          {isEn ? "Germany" : "Deutschland"}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">{isEn ? "Contact" : "Kontakt"}</h2>
        <p className="mb-4">
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">{isEn ? "VAT" : "Umsatzsteuer"}</h2>
        <p className="mb-4">
          {isEn
            ? "As a small business pursuant to Section 19(1) German VAT Act (UStG), no VAT is charged or shown."
            : "Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet und ausgewiesen."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">
          {isEn ? "Responsible for editorial content pursuant to Section 18(2) MStV" : "Verantwortlich für den Inhalt gemäß § 18 Abs. 2 MStV"}
        </h2>
        <p className="mb-4">
          Sebastian Siebert
          <br />
          Josef-Kastl-Straße 4
          <br />
          82377 Penzberg
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">
          {isEn ? "Consumer dispute resolution / online dispute resolution" : "Verbraucherstreitbeilegung / Online-Streitbeilegung"}
        </h2>
        <p className="mb-4">
          {isEn
            ? "The European Commission discontinued the online dispute resolution platform (ODR platform) on July 20, 2025; filing complaints via this platform is no longer possible."
            : "Die Europäische Kommission hat die Plattform zur Online-Streitbeilegung (OS-Plattform) zum 20. Juli 2025 eingestellt; eine Beschwerdeeinreichung über diese Plattform ist nicht mehr möglich."}
        </p>
        <p className="mb-4">
          {isEn
            ? "We are neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board pursuant to Section 36 VSBG. For questions or issues, contact us directly via the email address above."
            : "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle im Sinne des § 36 VSBG teilzunehmen. Bei Fragen oder Problemen erreichen Sie uns direkt unter der oben angegebenen E-Mail-Adresse."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">{isEn ? "Liability for links" : "Haftung für Links"}</h2>
        <p className="mb-4">
          {isEn
            ? "Our service contains links to external third-party websites over whose content we have no control. Therefore, we cannot assume any liability for such external content. The respective provider or operator is always responsible for the content of linked pages. Linked pages were checked for possible legal violations at the time of linking; illegal content was not identifiable at that time. If we become aware of legal violations, we will remove such links immediately. Links saved by users are private user content and are not reviewed by us editorially."
            : "Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft; rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen. Von Nutzern gespeicherte Links sind private Inhalte der jeweiligen Nutzer und werden von uns nicht redaktionell geprüft."}
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={localizePath("/", locale)} className="text-primary font-medium hover:underline">{isEn ? "← Back to home" : "← Zurück zur Startseite"}</Link>
          <Link href={localizePath("/datenschutz", locale)} className="text-primary font-medium hover:underline">{isEn ? "Privacy policy" : "Datenschutzerklärung"}</Link>
          <Link href={localizePath("/agb", locale)} className="text-primary font-medium hover:underline">{isEn ? "Terms" : "AGB"}</Link>
          <Link href={localizePath("/widerruf", locale)} className="text-primary font-medium hover:underline">{isEn ? "Right of withdrawal" : "Widerrufsbelehrung"}</Link>
        </div>
      </div>
    </div>
  );
}
