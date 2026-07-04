import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

// Löscht den Account des eingeloggten Nutzers unwiderruflich:
// 1. Stripe-Kunde löschen (kündigt laufende Abos automatisch sofort)
// 2. Alle Nutzerdaten aus der DB entfernen (links -> sections -> tabs -> profiles)
// 3. Den Auth-User selbst löschen
// Reihenfolge ist bewusst: Erst Zahlungen stoppen, dann Daten, dann Login.
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    // 1. Stripe aufräumen, damit keine weiteren Zahlungen abgebucht werden
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.stripe_customer_id) {
      try {
        await getStripe().customers.del(profile.stripe_customer_id);
      } catch (err) {
        // Kunde existiert bei Stripe nicht mehr -> kein Problem, weiter löschen
        if (!(err instanceof Stripe.errors.StripeError && err.statusCode === 404)) throw err;
      }
    }

    // 2. Nutzerdaten löschen (Kind-Tabellen zuerst, falls kein ON DELETE CASCADE existiert)
    for (const table of ["links", "sections", "tabs"] as const) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", user.id);
      if (error) throw new Error(`Failed to delete from "${table}": ${error.message}`);
    }
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", user.id);
    if (profileError) throw new Error(`Failed to delete profile: ${profileError.message}`);

    // 3. Auth-User löschen - danach ist kein Login mehr möglich
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authError) throw new Error(`Failed to delete auth user: ${authError.message}`);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Account deletion failed:", err);
    return NextResponse.json({ error: "Account could not be deleted" }, { status: 500 });
  }
}
