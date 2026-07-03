import Stripe from "stripe";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-Initialisierung, damit der Build (z. B. auf Vercel) nicht abstürzt,
// wenn die Env-Variablen zum Build-Zeitpunkt noch nicht gesetzt sind.
// Gleiche Konvention wie in supabaseClient.ts.
let stripeInstance: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt");
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

// Admin-Client mit Service-Role-Key: Nur serverseitig verwenden (Webhook)!
// Umgeht RLS, damit der Stripe-Webhook den Premium-Status schreiben kann.
let adminInstance: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) throw new Error("Supabase-Admin-Env-Variablen sind nicht gesetzt");
    adminInstance = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminInstance;
}

// Verifiziert das vom Client mitgeschickte Supabase-Access-Token (Authorization: Bearer ...)
// und liefert den eingeloggten User zurück - oder null, wenn nicht authentifiziert.
export async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

// Serverseitiges Mapping von Plan-Name auf Stripe-Price-ID.
// Der Client schickt NUR den Plan-Namen - niemals Preise oder Price-IDs,
// damit niemand den Preis manipulieren kann.
export const PLAN_PRICE_ENV: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

export type PremiumPlan = "monthly" | "yearly" | "lifetime";

export function isPremiumPlan(value: unknown): value is PremiumPlan {
  return value === "monthly" || value === "yearly" || value === "lifetime";
}
