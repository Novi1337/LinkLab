import { NextResponse } from "next/server";
import { getStripe, getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

// Öffnet das Stripe-Billing-Portal, in dem der Nutzer sein Abo selbst
// verwalten kann (Zahlungsmethode ändern, Rechnungen einsehen, kündigen).
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  try {
    const { data: profile } = await getSupabaseAdmin()
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "Kein Stripe-Kundenkonto vorhanden" }, { status: 404 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Billing-Portal Fehler:", err);
    return NextResponse.json({ error: "Portal konnte nicht geöffnet werden" }, { status: 500 });
  }
}
