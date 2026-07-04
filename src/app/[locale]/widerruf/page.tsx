import type { Metadata } from "next";
import Link from "next/link";
import type { AppLocale } from "@/lib/locale";
import { localizePath } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Withdrawal Policy | LinkLib" : "Widerrufsbelehrung | LinkLib",
    description:
      locale === "en"
        ? "Withdrawal policy and model withdrawal form for LinkLib Premium."
        : "Widerrufsbelehrung und Muster-Widerrufsformular für LinkLib Premium.",
    robots: { index: false, follow: true },
  };
}

export default async function WithdrawalPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const isEn = locale === "en";

  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">{isEn ? "Withdrawal Policy" : "Widerrufsbelehrung"}</h1>

        <p className="mb-4">
          {isEn
            ? "Consumers may have a statutory right of withdrawal when concluding distance contracts (for example purchasing LinkLib Premium)."
            : "Verbrauchern im Sinne des § 13 BGB steht beim Abschluss eines Fernabsatzgeschäfts (z. B. Kauf von LinkLib Premium) das nachfolgende Widerrufsrecht zu."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">{isEn ? "Right of withdrawal" : "Widerrufsrecht"}</h2>
        <p className="mb-4">
          {isEn
            ? "You have the right to withdraw from this contract within fourteen days without giving any reason. The withdrawal period is fourteen days from the date of contract conclusion."
            : "Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses."}
        </p>
        <p className="mb-4">{isEn ? "To exercise your right of withdrawal, contact:" : "Um Ihr Widerrufsrecht auszuüben, müssen Sie uns"}</p>
        <p className="mb-4 pl-4 border-l-2 border-slate-200">
          Sebastian Siebert
          <br />
          Josef-Kastl-Straße 4
          <br />
          82377 Penzberg, {isEn ? "Germany" : "Deutschland"}
          <br />
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>
        <p className="mb-4">
          {isEn
            ? "You may use the model withdrawal form below, but this is not mandatory. It is sufficient to send the notice of withdrawal before the withdrawal period expires."
            : "mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">{isEn ? "Consequences of withdrawal" : "Folgen des Widerrufs"}</h2>
        <p className="mb-4">
          {isEn
            ? "If you withdraw from this contract, we will reimburse all payments received from you without undue delay and no later than within fourteen days from receiving your notice of withdrawal, using the same payment method unless agreed otherwise."
            : "Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet."}
        </p>
        <p className="mb-4">
          {isEn
            ? "If you requested that services begin during the withdrawal period, you must pay an appropriate amount corresponding to services provided up to the time of withdrawal."
            : "Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll, so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">
          {isEn ? "Early expiry for digital services" : "Vorzeitiges Erlöschen des Widerrufsrechts bei digitalen Inhalten"}
        </h2>
        <p className="mb-4">
          {isEn
            ? "For digital services not supplied on a tangible medium, the right of withdrawal may expire once performance has begun after you expressly consented to immediate performance and acknowledged the loss of the right of withdrawal."
            : "Bei einem Vertrag über die Bereitstellung nicht auf einem körperlichen Datenträger befindlicher digitaler Inhalte bzw. digitaler Dienstleistungen erlischt das Widerrufsrecht gemäß § 356 Abs. 4 und 5 BGB, wenn wir mit der Ausführung des Vertrags begonnen haben, nachdem Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnen, und Ihre Kenntnis davon bestätigt haben, dass Ihr Widerrufsrecht mit Beginn der Ausführung des Vertrags erlischt."}
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">{isEn ? "Model withdrawal form" : "Muster-Widerrufsformular"}</h2>
        <p className="mb-2">
          {isEn
            ? "(If you wish to withdraw from the contract, please complete and return this form.)"
            : "(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)"}
        </p>
        <div className="mb-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-relaxed">
          <p className="mb-2">
            {isEn ? "To:" : "An:"} Sebastian Siebert, Josef-Kastl-Straße 4, 82377 Penzberg, {isEn ? "Germany" : "Deutschland"}
            <br />
            E-Mail: admin@getlinklib.com
          </p>
          <p className="mb-2">
            {isEn
              ? "I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract for the provision of the following service:"
              : "Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung der folgenden Dienstleistung (*):"}
          </p>
          <p className="mb-2">- {isEn ? "Ordered on / received on" : "Bestellt am / erhalten am"} (*): ____________________</p>
          <p className="mb-2">- {isEn ? "Name of consumer(s)" : "Name des/der Verbraucher(s)"}: ____________________</p>
          <p className="mb-2">- {isEn ? "Address of consumer(s)" : "Anschrift des/der Verbraucher(s)"}: ____________________</p>
          <p className="mb-2">- {isEn ? "Signature of consumer(s) (only if notified on paper)" : "Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)"}: ____________________</p>
          <p className="mb-2">- {isEn ? "Date" : "Datum"}: ____________________</p>
          <p className="m-0">(*) {isEn ? "Delete as appropriate." : "Unzutreffendes streichen."}</p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href={localizePath("/", locale)} className="text-primary font-medium hover:underline">{isEn ? "← Back to home" : "← Zurück zur Startseite"}</Link>
          <Link href={localizePath("/agb", locale)} className="text-primary font-medium hover:underline">{isEn ? "Terms" : "AGB"}</Link>
          <Link href={localizePath("/impressum", locale)} className="text-primary font-medium hover:underline">{isEn ? "Legal notice" : "Impressum"}</Link>
          <Link href={localizePath("/datenschutz", locale)} className="text-primary font-medium hover:underline">{isEn ? "Privacy policy" : "Datenschutzerklärung"}</Link>
        </div>
      </div>
    </div>
  );
}
