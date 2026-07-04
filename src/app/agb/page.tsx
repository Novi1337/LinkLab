import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | LinkLib",
  description: "Terms and conditions for using LinkLib and LinkLib Premium.",
  robots: { index: false, follow: true },
};

export default function AGB() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Terms and Conditions</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">1. Scope and Provider</h2>
        <p className="mb-4">
          These Terms and Conditions apply to the use of the website getlinklib.com (&quot;LinkLib&quot;)
          and to the purchase of paid Premium services. The provider is Sebastian Siebert,
          Josef-Kastl-Straße 4, 82377 Penzberg, Germany (see{" "}
          <Link href="/impressum" className="text-primary hover:underline">Legal Notice</Link>).
          The service is intended for consumers within the meaning of Section 13 BGB.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">2. Service Description</h2>
        <p className="mb-4">
          LinkLib is a cloud-based service for saving, organizing, and managing bookmarks (links).
          Core usage is free and financed through advertising. With &quot;LinkLib Premium&quot;, the service
          can be used without ads. Premium is available as a monthly subscription, yearly subscription,
          or one-time purchase (&quot;Lifetime&quot;).
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">3. Registration and User Account</h2>
        <p className="mb-4">
          Using LinkLib requires a user account (via email/password or sign-in with GitHub or Google).
          Users are required to keep their access credentials confidential. There is no entitlement to registration.
          Accounts can be deleted by users at any time in account settings.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">4. Conclusion of Contract</h2>
        <p className="mb-4">
          The presentation of Premium plans on the website does not constitute a legally binding offer,
          but an invitation to place an order. The ordering process is as follows:
        </p>
        <ol className="list-decimal ml-6 mb-4 flex flex-col gap-1">
          <li>Select the desired plan (monthly, yearly, or lifetime) in the upgrade dialog.</li>
          <li>You are redirected to the secure payment page of our payment provider Stripe. All order details and total price are shown again, and input errors can be corrected before submission.</li>
          <li>By clicking the payment-confirming order button, you submit a binding offer to conclude the contract.</li>
          <li>The contract is concluded when we accept the order by activating Premium features and/or sending a confirmation email.</li>
        </ol>
        <p className="mb-4">
          The contract language is English. We do not permanently store the contract text;
          order details are provided by Stripe via email receipt.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">5. Prices and Payment</h2>
        <p className="mb-4">
          The prices displayed at the time of order apply. As a small business under Section 19 (1) UStG,
          VAT is not charged or shown separately. Payments are processed via Stripe; available payment methods
          are those offered there (for example credit card). Subscription fees are due in advance for the
          applicable billing period.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">6. Subscription Term and Cancellation</h2>
        <p className="mb-4">
          Monthly and yearly subscriptions renew automatically for the respective billing period unless canceled
          before the end of the current term. Cancellation is possible at any time effective at the end of the
          current billing period — directly in account settings via Stripe’s customer portal or by email to{" "}
          <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>.
          Fees already paid for the current period are not refunded pro rata. Premium remains active until the end
          of the paid period. The Lifetime plan is a one-time purchase with no recurring term. The right to extraordinary
          termination for good cause remains unaffected.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">7. Right of Withdrawal</h2>
        <p className="mb-4">
          Consumers have a statutory right of withdrawal. Details, instructions, and the sample withdrawal form
          are available in the{" "}
          <Link href="/widerruf" className="text-primary hover:underline">Right of Withdrawal</Link>.
          Please note: if you request immediate provision of Premium features before the withdrawal period ends,
          your withdrawal right may expire in accordance with legal requirements, and compensation may be due
          for services already provided.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">8. User Obligations and Prohibited Use</h2>
        <p className="mb-4">
          Users may not misuse the service, in particular by saving or distributing links to illegal content,
          or by performing actions that impair service functionality. In cases of serious or repeated violations,
          we may suspend or delete accounts.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">9. Availability and Service Changes</h2>
        <p className="mb-4">
          We strive to provide uninterrupted service availability but do not guarantee any specific uptime.
          Maintenance, further development, or technical disruptions may cause temporary limitations. We recommend
          keeping your own backups (exports/notes) for important links.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">10. Liability</h2>
        <p className="mb-4">
          We are liable without limitation for intent and gross negligence, and for damages resulting from
          injury to life, body, or health. In cases of simple negligence, we are liable only for breach of
          essential contractual obligations (cardinal duties), limited to foreseeable, typical contractual damage.
          Liability under the Product Liability Act remains unaffected. We assume no responsibility for content
          of external websites saved by users.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">11. Dispute Resolution</h2>
        <p className="mb-4">
          The EU Online Dispute Resolution platform (ODR platform) was discontinued on July 20, 2025.
          We are neither willing nor obliged to participate in dispute resolution proceedings before
          a consumer arbitration board pursuant to Section 36 VSBG.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">12. Final Provisions</h2>
        <p className="mb-4">
          The law of the Federal Republic of Germany applies, excluding the UN Convention on Contracts for
          the International Sale of Goods (CISG). For consumers, this choice of law applies only to the extent
          it does not remove protection granted by mandatory provisions of the law of their habitual residence.
          If individual provisions of these Terms are invalid, the validity of the remaining provisions remains unaffected.
        </p>

        <p className="mb-4 text-sm text-slate-500">Version: July 2026</p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Back to Home</Link>
          <Link href="/impressum" className="text-primary font-medium hover:underline">Legal Notice</Link>
          <Link href="/datenschutz" className="text-primary font-medium hover:underline">Privacy Policy</Link>
          <Link href="/widerruf" className="text-primary font-medium hover:underline">Right of Withdrawal</Link>
        </div>
      </div>
    </div>
  );
}
