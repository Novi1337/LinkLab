import { NextResponse } from "next/server";
import { getStripe, getSupabaseAdmin, getUserFromRequest, isPremiumPlan, PLAN_PRICE_ENV } from "@/lib/stripe";

// Erstellt eine Stripe-Checkout-Session (gehostete Bezahlseite) für den eingeloggten Nutzer.
// Der Client schickt nur den Plan-Namen ("premium" | "premium_plus" | "lifetime") -
// Preise und Price-IDs bleiben ausschließlich serverseitig (Manipulationsschutz).
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let plan: unknown;
  try {
    ({ plan } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!isPremiumPlan(plan)) {
    return NextResponse.json({ error: "Unknown plan" }, { status: 400 });
  }

  const priceId = PLAN_PRICE_ENV[plan];
  if (!priceId) {
    return NextResponse.json({ error: `Price ID for plan "${plan}" is not configured` }, { status: 500 });
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

    // Lifetime-Kunden brauchen kein weiteres Abo/keinen weiteren Kauf
    if (profile?.premium_plan === "lifetime") {
      return NextResponse.json({ error: "You already have lifetime Premium access" }, { status: 400 });
    }

    // Abo-Wechsel (premium <-> premium_plus) läuft über das Stripe-Kundenportal,
    // damit kein zweites Abo parallel entsteht. Nur das Lifetime-Upgrade darf
    // per Checkout gekauft werden - der Webhook beendet dann das alte Abo.
    if (plan !== "lifetime" && profile?.premium_plan && profile?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "You already have an active subscription. You can change plans in the customer portal (Account -> Manage Subscription)." },
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
      mode: plan === "lifetime" ? "payment" : "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
      // Über die Metadata ordnet der Webhook die Zahlung dem Supabase-User zu
      metadata: { supabase_user_id: user.id, plan },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Checkout could not be started" }, { status: 500 });
  }
}
