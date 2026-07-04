import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Legal Notice | LinkLib",
  description: "Legal notice and provider information for LinkLib.",
  robots: { index: false, follow: true },
};

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Legal Notice</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">Information pursuant to Section 5 DDG</h2>
        <p className="mb-4">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg<br />
          Germany
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Contact</h2>
        <p className="mb-4">
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">VAT</h2>
        <p className="mb-4">
          As a small business under Section 19 (1) UStG, VAT is not charged or shown separately.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Responsible for Content under Section 18 (2) MStV</h2>
        <p className="mb-4">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Consumer Dispute Resolution / Online Dispute Resolution</h2>
        <p className="mb-4">
          The European Commission discontinued the Online Dispute Resolution platform (ODR platform)
          on July 20, 2025. Filing complaints via this platform is no longer possible.
        </p>
        <p className="mb-4">
          We are neither willing nor obliged to participate in dispute resolution proceedings before
          a consumer arbitration board pursuant to Section 36 VSBG. If you have any questions or issues,
          please contact us directly via the email address above.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">Liability for Links</h2>
        <p className="mb-4">
          Our service contains links to external third-party websites over whose content we have no control.
          Therefore, we cannot assume any liability for such external content. The respective provider or operator
          is always responsible for the content of linked pages. Linked pages were checked for potential legal
          violations at the time of linking; no unlawful content was identifiable at that time. If we become aware
          of legal violations, we will remove such links immediately. Links saved by users are private user content
          and are not editorially reviewed by us.
        </p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Back to Home</Link>
          <Link href="/datenschutz" className="text-primary font-medium hover:underline">Privacy Policy</Link>
          <Link href="/agb" className="text-primary font-medium hover:underline">Terms & Conditions</Link>
          <Link href="/widerruf" className="text-primary font-medium hover:underline">Right of Withdrawal</Link>
        </div>
      </div>
    </div>
  );
}
