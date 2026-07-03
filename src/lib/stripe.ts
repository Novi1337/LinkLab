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

// Wie getUserFromRequest, liefert den User aber nur zurück, wenn er die
// Admin-Rolle besitzt (app_metadata.role = 'admin', siehe supabase/admins.sql).
// app_metadata ist ausschließlich serverseitig änderbar und daher fälschungssicher.
export async function getAdminFromRequest(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user || user.app_metadata?.role !== "admin") return null;
  return user;
}

// Serverseitiges Mapping von Plan-Name auf Stripe-Price-ID.
// Der Client schickt NUR den Plan-Namen - niemals Preise oder Price-IDs,
// damit niemand den Preis manipulieren kann.
export const PLAN_PRICE_ENV: Record<string, string | undefined> = {
  premium: process.env.STRIPE_PRICE_PREMIUM,
  premium_plus: process.env.STRIPE_PRICE_PREMIUM_PLUS,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

// premium      = 12 €/Jahr: unbegrenzte Reiter/Abschnitte, werbefrei
// premium_plus = 24 €/Jahr: wie premium + Inkognito-Modus
// lifetime     = 69 € einmalig: wie premium_plus, ohne Abo
export type PremiumPlan = "premium" | "premium_plus" | "lifetime";

export function isPremiumPlan(value: unknown): value is PremiumPlan {
  return value === "premium" || value === "premium_plus" || value === "lifetime";
}
