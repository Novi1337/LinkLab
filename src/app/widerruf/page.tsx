import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Right of Withdrawal | LinkLib",
  description: "Withdrawal information and sample withdrawal form for LinkLib Premium.",
  robots: { index: false, follow: true },
};

export default function Widerruf() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Right of Withdrawal</h1>

        <p className="mb-4">
          Consumers within the meaning of Section 13 BGB have the following right of withdrawal
          when concluding distance contracts (for example, purchasing LinkLib Premium).
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Withdrawal Right</h2>
        <p className="mb-4">
          You have the right to withdraw from this contract within fourteen days without giving any reason.
          The withdrawal period is fourteen days from the date of contract conclusion.
        </p>
        <p className="mb-4">
          To exercise your withdrawal right, you must inform us:
        </p>
        <p className="mb-4 pl-4 border-l-2 border-slate-200">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg, Germany<br />
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>
        <p className="mb-4">
          by means of a clear statement (for example by post or email) of your decision to withdraw from this contract.
          You may use the sample withdrawal form below, but this is not mandatory. To meet the withdrawal deadline,
          it is sufficient to send your communication concerning your exercise of the right before the withdrawal period expires.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Effects of Withdrawal</h2>
        <p className="mb-4">
          If you withdraw from this contract, we will reimburse all payments received from you without undue delay
          and at the latest within fourteen days from the day we receive your withdrawal notice. We will use the same
          payment method that you used for the original transaction unless expressly agreed otherwise with you.
          In no event will you be charged any fees for this reimbursement.
        </p>
        <p className="mb-4">
          If you requested that the service begin during the withdrawal period, you must pay us an appropriate amount
          corresponding to the proportion of services already provided up to the point at which you informed us of your
          exercise of the withdrawal right, compared with the total scope of services provided for in the contract.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Early Expiry of the Withdrawal Right for Digital Content</h2>
        <p className="mb-4">
          For contracts on the provision of digital content or digital services not supplied on a physical medium,
          the withdrawal right expires under Section 356(4) and (5) BGB if we have started contract performance after you
        </p>
        <ul className="list-disc ml-6 mb-4 flex flex-col gap-1">
          <li>expressly agreed that we may begin performance before the withdrawal period expires, and</li>
          <li>confirmed your awareness that your withdrawal right expires once performance begins.</li>
        </ul>
        <p className="mb-4">
          When purchasing LinkLib Premium (especially the Lifetime plan), Premium features are activated immediately
          after payment is received. If you expressly consented to immediate performance and acknowledged the expiry
          of the withdrawal right, no withdrawal right remains thereafter.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Sample Withdrawal Form</h2>
        <p className="mb-2">
          (If you wish to withdraw from the contract, please complete and return this form.)
        </p>
        <div className="mb-4 p-5 rounded-xl bg-slate-50 border border-slate-200 text-sm leading-relaxed">
          <p className="mb-2">
            To: Sebastian Siebert, Josef-Kastl-Straße 4, 82377 Penzberg, Germany<br />
            E-Mail: admin@getlinklib.com
          </p>
          <p className="mb-2">
            I/We (*) hereby withdraw from the contract concluded by me/us (*) for the purchase of the following goods (*) /
            provision of the following service (*):
          </p>
          <p className="mb-2">- Ordered on (*) / received on (*): ____________________</p>
          <p className="mb-2">- Name of consumer(s): ____________________</p>
          <p className="mb-2">- Address of consumer(s): ____________________</p>
          <p className="mb-2">- Signature of consumer(s) (only if submitted on paper): ____________________</p>
          <p className="mb-2">- Date: ____________________</p>
          <p className="m-0">(*) Delete as appropriate.</p>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Back to Home</Link>
          <Link href="/agb" className="text-primary font-medium hover:underline">Terms & Conditions</Link>
          <Link href="/impressum" className="text-primary font-medium hover:underline">Legal Notice</Link>
          <Link href="/datenschutz" className="text-primary font-medium hover:underline">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
