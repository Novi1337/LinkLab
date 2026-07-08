import type { Metadata } from "next";
import { Gift } from "lucide-react";
import { LegalFooter } from "@/components/LegalFooter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getSupabaseAdmin } from "@/lib/stripe";
import { localizePath, type AppLocale } from "@/lib/locale";

export const metadata: Metadata = {
  title: "Du wurdest zu LinkLib eingeladen",
  robots: { index: false, follow: true },
};

async function loadPreview(code: string): Promise<{ displayName: string | null; refereeDays: number } | null> {
  if (!/^[A-Za-z0-9]{4,16}$/.test(code)) return null;
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin
      .from("profiles")
      .select("share_nickname, premium_plan")
      .eq("referral_code", code.toUpperCase())
      .maybeSingle();
    if (!data) return null;
    return {
      displayName: data.share_nickname?.trim() || null,
      refereeDays: data.premium_plan === "premium" || data.premium_plan === "lifetime" ? 45 : 30,
    };
  } catch (err) {
    console.error("Referral-Preview (invite page) konnte nicht geladen werden:", err);
    return null;
  }
}

// Personalisierte Landingpage für einen geworbenen Freund: statt der
// unpersönlichen Startseite ein dedizierter "[Name] hat dir X Tage Premium
// geschenkt"-Screen. Social Proof senkt die Registrierungshürde massiv.
export default async function InvitePage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale: rawLocale, code } = await params;
  const locale: AppLocale = rawLocale === "en" ? "en" : "de";
  const isEn = locale === "en";

  const preview = await loadPreview(code);
  const refereeDays = preview?.refereeDays ?? 30;
  const friendLabel = isEn ? "A friend" : "Ein Freund";
  const displayName = preview?.displayName || friendLabel;

  const ctaHref = `${localizePath("/", locale)}?ref=${encodeURIComponent(code)}`;

  return (
    <div className="relative min-h-screen bg-[url('/bg.svg')] bg-[length:40px_40px] bg-center font-sans text-brand-dark">
      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm -z-10"></div>
      <div className="absolute right-5 top-5 z-20">
        <LanguageSwitcher />
      </div>
      <div className="flex items-center justify-center min-h-screen p-5">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center mb-6 drop-shadow-sm">
            <img src="/Wordmark.svg" alt="LinkLib Logo" className="h-[64px] w-auto max-w-full" />
          </div>

          <div className="bg-white/85 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Gift className="w-6 h-6" />
            </div>

            <h1 className="text-2xl font-extrabold mb-3 leading-snug">
              {isEn
                ? <>{displayName} gifted you {refereeDays} days of LinkLib Premium</>
                : <>{displayName} hat dir {refereeDays} Tage LinkLib Premium geschenkt</>}
            </h1>
            <p className="text-slate-500 font-medium mb-8">
              {isEn
                ? "LinkLib is the calm, private way to save and organize your links - in folders, synced everywhere, ad-free with Premium."
                : "LinkLib ist die ruhige, private Art, Links zu speichern und zu organisieren - in Ordnern, überall synchron, mit Premium werbefrei."}
            </p>

            <a
              href={ctaHref}
              className="block bg-primary text-white p-3.5 rounded-xl font-bold hover:bg-primary-hover hover:scale-[1.02] hover:shadow-xl active:scale-95 transition-all"
            >
              {isEn ? "Claim your gift - sign up for free" : "Geschenk annehmen - kostenlos registrieren"}
            </a>
            <p className="text-xs text-slate-400 mt-4 m-0">
              {isEn
                ? `${refereeDays} days of Premium are activated automatically after signup.`
                : `${refereeDays} Tage Premium werden nach der Registrierung automatisch freigeschaltet.`}
            </p>
          </div>

          <LegalFooter locale={locale} className="mt-10" />
        </div>
      </div>
    </div>
  );
}
