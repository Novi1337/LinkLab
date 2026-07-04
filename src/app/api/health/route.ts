import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/stripe";

// Konfigurations-Check: zeigt NUR, OB die Env-Variablen gesetzt sind (true/false),
// niemals die Werte selbst. Testet zusätzlich aktiv, ob der Server mit dem
// Service-Role-Key auf die profiles-Tabelle inkl. Referral-Spalten zugreifen kann.
// Aufruf: https://www.getlinklib.com/api/health

// Verhindert, dass Next die Route beim Build statisch einfriert -
// der Env-Status soll immer live vom Server kommen.
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: !!process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_PREMIUM: !!process.env.STRIPE_PRICE_PREMIUM,
    STRIPE_PRICE_PREMIUM_PLUS: !!process.env.STRIPE_PRICE_PREMIUM_PLUS,
    STRIPE_PRICE_LIFETIME: !!process.env.STRIPE_PRICE_LIFETIME,
  };

  // Aktiver DB-Test: schlägt fehl, wenn der Service-Role-Key ungültig ist
  // oder die Referral-Spalten in profiles fehlen (referrals.sql nicht ausgeführt).
  let database = "not tested - Supabase environment variables are missing";
  if (env.SUPABASE_SERVICE_ROLE_KEY && env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const { error } = await getSupabaseAdmin()
        .from("profiles")
        .select("referral_code", { count: "exact", head: true });
      database = error ? `Error ${error.code ?? "DB"}: ${error.message}` : "ok";
    } catch (err) {
      database = `Error: ${err instanceof Error ? err.message : "unknown"}`;
    }
  }

  return NextResponse.json({ env, database });
}
