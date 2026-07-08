import { NextResponse } from "next/server";
import { getStripe, getSupabaseAdmin, getUserFromRequest, isPurchasablePlan, PLAN_PRICE_ENV } from "@/lib/stripe";

// Erstellt eine Stripe-Checkout-Session (gehostete Bezahlseite) für den eingeloggten Nutzer.
// Es gibt nur einen käuflichen Plan ("premium", 24 €/Jahr). "lifetime" ist bewusst NICHT
// käuflich - dieser Plan wird Admins ausschließlich manuell per supabase/owner.sql vergeben.
// Preise und Price-IDs bleiben ausschließlich serverseitig (Manipulationsschutz).
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let plan: unknown;
  try {
    ({ plan } = await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }
  if (!isPurchasablePlan(plan)) {
    return NextResponse.json({ error: "Dieser Plan ist nicht käuflich" }, { status: 400 });
  }

  const priceId = PLAN_PRICE_ENV[plan];
  if (!priceId) {
    return NextResponse.json({ error: `Price-ID für Plan "${plan}" ist nicht konfiguriert` }, { status: 500 });
  }

  try {
    const stripe = getStripe();
    const supabaseAdmin = getSupabaseAdmin();

    // Bereits vorhandenen Stripe-Kunden wiederverwenden, damit ein Nutzer
    // nicht bei jedem Kauf als neuer Kunde angelegt wird.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, premium_plan, stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle();

    // Lifetime- oder bereits aktive Premium-Kunden brauchen keinen weiteren Kauf
    if (profile?.premium_plan === "lifetime") {
      return NextResponse.json({ error: "Du hast bereits lebenslangen Premium-Zugang" }, { status: 400 });
    }
    if (profile?.premium_plan && profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "Du hast bereits ein aktives Abo. Verwalte es im Kundenportal (Konto → Abo verwalten)." },
        { status: 400 }
      );
    }

    let customerId = profile?.stripe_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from("profiles")
        .upsert({ id: user.id, stripe_customer_id: customerId }, { onConflict: "id" });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      // Über die Metadata ordnet der Webhook die Zahlung dem Supabase-User zu
      metadata: { supabase_user_id: user.id, plan },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Fehler:", err);
    return NextResponse.json({ error: "Checkout konnte nicht gestartet werden" }, { status: 500 });
  }
}
