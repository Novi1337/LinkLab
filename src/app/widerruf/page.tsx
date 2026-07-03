import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Widerrufsbelehrung | LinkLib",
  description: "Widerrufsbelehrung und Muster-Widerrufsformular für LinkLib Premium.",
  robots: { index: false, follow: true },
};

export default function Widerruf() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Widerrufsbelehrung</h1>

        <p className="mb-4">
          Verbrauchern im Sinne des § 13 BGB steht beim Abschluss eines Fernabsatzgeschäfts
          (z. B. Kauf von LinkLib Premium) das nachfolgende Widerrufsrecht zu.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Widerrufsrecht</h2>
        <p className="mb-4">
          Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu
          widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
        </p>
        <p className="mb-4">
          Um Ihr Widerrufsrecht auszuüben, müssen Sie uns
        </p>
        <p className="mb-4 pl-4 border-l-2 border-slate-200">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg, Deutschland<br />
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>
        <p className="mb-4">
          mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine
          E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können
          dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht
          vorgeschrieben ist. Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
          Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist
          absenden.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Folgen des Widerrufs</h2>
        <p className="mb-4">
          Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen
          erhalten haben, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag
          zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns
          eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie
          bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde
          ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser
          Rückzahlung Entgelte berechnet.
        </p>
        <p className="mb-4">
          Haben Sie verlangt, dass die Dienstleistung während der Widerrufsfrist beginnen soll,
          so haben Sie uns einen angemessenen Betrag zu zahlen, der dem Anteil der bis zu dem
          Zeitpunkt, zu dem Sie uns von der Ausübung des Widerrufsrechts hinsichtlich dieses
          Vertrags unterrichten, bereits erbrachten Dienstleistungen im Vergleich zum
          Gesamtumfang der im Vertrag vorgesehenen Dienstleistungen entspricht.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Vorzeitiges Erlöschen des Widerrufsrechts bei digitalen Inhalten</h2>
        <p className="mb-4">
          Bei einem Vertrag über die Bereitstellung nicht auf einem körperlichen Datenträger
          befindlicher digitaler Inhalte bzw. digitaler Dienstleistungen erlischt das
          Widerrufsrecht gemäß § 356 Abs. 4 und 5 BGB, wenn wir mit der Ausführung des Vertrags
          begonnen haben, nachdem Sie
        </p>
        <ul className="list-disc ml-6 mb-4 flex flex-col gap-1">
          <li>ausdrücklich zugestimmt haben, dass wir mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist beginnen, und</li>
          <li>Ihre Kenntnis davon bestätigt haben, dass Ihr Widerrufsrecht mit Beginn der Ausführung des Vertrags erlischt.</li>
        </ul>
        <p className="mb-4">
          Beim Kauf von LinkLib Premium (insbesondere beim Lifetime-Plan) werden die
          Premium-Funktionen unmittelbar nach Zahlungseingang freigeschaltet. Sofern Sie dem
          sofortigen Beginn ausdrücklich zugestimmt und das Erlöschen des Widerrufsrechts
          bestätigt haben, besteht danach kein Widerrufsrecht mehr.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Muster-Widerrufsformular</h2>
        <p className="mb-2">
          (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und
          senden Sie es zurück.)
        </p>
        <div className="mb-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-relaxed">
          <p className="mb-2">
            An: Sebastian Siebert, Josef-Kastl-Straße 4, 82377 Penzberg, Deutschland<br />
            E-Mail: admin@getlinklib.com
          </p>
          <p className="mb-2">
            Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den
            Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*):
          </p>
          <p className="mb-2">– Bestellt am (*) / erhalten am (*): ____________________</p>
          <p className="mb-2">– Name des/der Verbraucher(s): ____________________</p>
          <p className="mb-2">– Anschrift des/der Verbraucher(s): ____________________</p>
          <p className="mb-2">– Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): ____________________</p>
          <p className="mb-2">– Datum: ____________________</p>
          <p className="m-0">(*) Unzutreffendes streichen.</p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Zurück zur Startseite</Link>
          <Link href="/agb" className="text-primary font-medium hover:underline">AGB</Link>
          <Link href="/impressum" className="text-primary font-medium hover:underline">Impressum</Link>
          <Link href="/datenschutz" className="text-primary font-medium hover:underline">Datenschutzerklärung</Link>
        </div>
      </div>
    </div>
  );
}
