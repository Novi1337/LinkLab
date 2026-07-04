import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | LinkLib",
  description: "Information about the processing of personal data at LinkLib in accordance with GDPR.",
  robots: { index: false, follow: true },
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-card py-16 px-5">
      <div className="max-w-[800px] mx-auto">
        <h1 className="text-3xl font-bold text-brand-dark mb-8">Privacy Policy</h1>

        <h2 className="text-xl font-bold mt-6 mb-2">1. Controller</h2>
        <p className="mb-4">
          The controller within the meaning of the General Data Protection Regulation (GDPR) is:
        </p>
        <p className="mb-4 pl-4 border-l-2 border-slate-200">
          Sebastian Siebert<br />
          Josef-Kastl-Straße 4<br />
          82377 Penzberg, Germany<br />
          E-Mail: <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">2. General Information on Data Processing</h2>
        <p className="mb-4">
          We take the protection of your personal data very seriously and process personal data only to the
          extent required to provide our services or where you have given consent. The legal bases include,
          in particular, Art. 6(1)(a) GDPR (consent), Art. 6(1)(b) GDPR (performance of a contract), and
          Art. 6(1)(f) GDPR (legitimate interests). Data is deleted when the purpose of processing no longer
          applies and no statutory retention obligations prevent deletion.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">3. Hosting (Vercel)</h2>
        <p className="mb-4">
          Our website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA.
          When you visit the website, Vercel processes technically necessary data (IP address,
          date and time of access, requested page, browser type) in server logs to deliver the website
          and ensure security and stability (Art. 6(1)(f) GDPR). We have a data processing agreement with
          Vercel. Transfers to the USA are based on EU Standard Contractual Clauses and/or the EU-US Data Privacy Framework.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">4. Registration and User Account (Supabase)</h2>
        <p className="mb-4">
          Using LinkLib requires a user account. We use Supabase (Supabase Inc.) for authentication and data storage.
          Our database is operated in an EU data center (Frankfurt region). We process your email address, a password hash,
          and the content you save (legal basis: Art. 6(1)(b) GDPR - performance of a contract).
        </p>
        <p className="mb-4">
          Alternatively, you can sign in via GitHub (GitHub, Inc.) or Google (Google Ireland Limited).
          In this case, we receive your email address and a user identifier from the respective provider.
          The privacy policy of the relevant login provider applies to their processing.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">5. Saved Links and Content</h2>
        <p className="mb-4">
          The links, sections, and tabs you save are stored in our database to provide the service
          (Art. 6(1)(b) GDPR). When adding a link, our servers retrieve metadata from the target page
          (title, description, preview image) to display a preview. You can delete links, sections, and your
          entire account at any time. Account deletion removes all related data.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">6. Link Data Analysis and Profiling (Consent-Based Only)</h2>
        <p className="mb-4">
          If you consent to personalized advertising via the cookie banner, we analyze your saved content
          (titles, domains, and section names of added links) to derive interest categories (profiling,
          Art. 6(1)(a) GDPR). These profiles are used to tailor advertising on our website and may be
          shared in part with ad networks (such as Google AdSense). No such analysis takes place without
          your consent. You can withdraw consent at any time for the future via
          &quot;Cookie Settings&quot; in the footer.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">7. Google AdSense</h2>
        <p className="mb-4">
          If you have provided consent (Art. 6(1)(a) GDPR, Section 25(1) TDDDG), we display advertisements
          via Google AdSense, a service of Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland.
          Google uses cookies and similar technologies to display interest-based ads and measure ad performance.
          Data may be transferred to servers of Google LLC in the USA (basis: EU Standard Contractual Clauses /
          EU-US Data Privacy Framework). Without consent, no AdSense scripts are loaded. Further information:{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">policies.google.com/privacy</a>.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">8. Payment Processing (Stripe)</h2>
        <p className="mb-4">
          For purchases of LinkLib Premium, we use the payment service provider Stripe (Stripe Payments Europe, Ltd.,
          1 Grand Canal Street Lower, Dublin, Ireland). During checkout, you are redirected to Stripe’s payment page,
          where Stripe processes your payment data (for example card details) under its own responsibility. We only
          receive information about your payment and subscription status (legal basis: Art. 6(1)(b) GDPR). Further information:{" "}
          <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">stripe.com/de/privacy</a>.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">9. Cookies and Local Storage</h2>
        <p className="mb-4">
          We use technically necessary storage technologies (Section 25(2) TDDDG), for example to store
          your login session (Supabase Auth) and your cookie choice in your browser’s local storage.
          Non-essential cookies (especially advertising cookies from Google AdSense) are set only after your
          consent via the cookie banner (Section 25(1) TDDDG, Art. 6(1)(a) GDPR). You can change your choice
          at any time via &quot;Cookie Settings&quot; in the footer.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">10. Your Rights</h2>
        <p className="mb-4">You have the following rights regarding your personal data:</p>
        <ul className="list-disc ml-6 mb-4 flex flex-col gap-1">
          <li>Right of access (Art. 15 GDPR)</li>
          <li>Right to rectification (Art. 16 GDPR)</li>
          <li>Right to erasure (Art. 17 GDPR)</li>
          <li>Right to restriction of processing (Art. 18 GDPR)</li>
          <li>Right to data portability (Art. 20 GDPR)</li>
          <li>Right to object to processing (Art. 21 GDPR)</li>
          <li>Right to withdraw consent at any time with effect for the future (Art. 7(3) GDPR)</li>
        </ul>
        <p className="mb-4">
          To exercise your rights, simply send an email to{" "}
          <a href="mailto:admin@getlinklib.com" className="text-primary hover:underline">admin@getlinklib.com</a>.
          You also have the right to lodge a complaint with a supervisory authority (Art. 77 GDPR).
          The authority responsible for us is the Bavarian State Office for Data Protection Supervision
          (BayLDA), Promenade 18, 91522 Ansbach, Germany.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">11. Deletion of Data and Account</h2>
        <p className="mb-4">
          You can delete your account, including all saved links, at any time in account settings.
          Upon deletion, your data is removed from our database without undue delay, unless statutory
          retention obligations apply (for example for payment records).
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">12. Data Security</h2>
        <p className="mb-4">
          All data is transmitted in encrypted form via HTTPS/TLS. Passwords are stored only as hashes.
          We implement appropriate technical and organizational measures to protect your data against loss
          and unauthorized access.
        </p>

        <h2 className="text-xl font-bold mt-6 mb-2">13. Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We update this Privacy Policy whenever changes to our service or legal requirements make this necessary.
          The version published here is always the current version.
        </p>

        <p className="mb-4 text-sm text-slate-500">Version: July 2026</p>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2">
          <Link href="/" className="text-primary font-medium hover:underline">← Back to Home</Link>
          <Link href="/impressum" className="text-primary font-medium hover:underline">Legal Notice</Link>
          <Link href="/agb" className="text-primary font-medium hover:underline">Terms & Conditions</Link>
          <Link href="/widerruf" className="text-primary font-medium hover:underline">Right of Withdrawal</Link>
        </div>
      </div>
    </div>
  );
}
