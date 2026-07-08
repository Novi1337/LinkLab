import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rateLimit";

// Löscht den Account des eingeloggten Nutzers unwiderruflich:
// 1. Stripe-Kunde löschen (kündigt laufende Abos automatisch sofort)
// 2. Alle Nutzerdaten aus der DB entfernen (links -> sections -> tabs -> profiles)
// 3. Den Auth-User selbst löschen
// Reihenfolge ist bewusst: Erst Zahlungen stoppen, dann Daten, dann Login.
//
// Schutz gegen versehentliche/automatisierte Löschung (z. B. per geleaktem Token
// oder XSS-One-Shot): Der Request muss die eigene E-Mail-Adresse als explizite
// Bestätigung im Body mitschicken - ein blinder POST ohne Kenntnis der E-Mail
// reicht nicht aus. Zusätzlich ist die Route rate-limitiert.
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  if (!checkRateLimit(`account-delete:${user.id}`, 3, 60_000)) {
    return NextResponse.json({ error: "Zu viele Versuche. Bitte kurz warten." }, { status: 429 });
  }

  let confirmEmail: unknown;
  try {
    ({ confirmEmail } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bestätigung erforderlich" }, { status: 400 });
  }
  if (
    typeof confirmEmail !== "string" ||
    !user.email ||
    confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Bestätigung fehlgeschlagen: Bitte gib deine E-Mail-Adresse exakt ein." },
      { status: 400 }
    );
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
      if (error) throw new Error(`Löschen aus "${table}" fehlgeschlagen: ${error.message}`);
    }
    const { error: profileError } = await supabaseAdmin.from("profiles").delete().eq("id", user.id);
    if (profileError) throw new Error(`Löschen des Profils fehlgeschlagen: ${profileError.message}`);

    // 3. Auth-User löschen - danach ist kein Login mehr möglich
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authError) throw new Error(`Löschen des Auth-Users fehlgeschlagen: ${authError.message}`);

    return NextResponse.json({ deleted: true });
  } catch (err) {
    console.error("Account-Löschung fehlgeschlagen:", err);
    return NextResponse.json({ error: "Account konnte nicht gelöscht werden" }, { status: 500 });
  }
}
