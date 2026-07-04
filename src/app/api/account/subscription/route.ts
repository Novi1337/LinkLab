import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

// Liefert die Abo-Details des eingeloggten Nutzers (Plan, Laufzeit, Erneuerung)
// und erlaubt das Kündigen/Reaktivieren des Abos zum Periodenende.
// Die Daten kommen live von Stripe, damit Restlaufzeit und Kündigungsstatus
// immer aktuell sind - unabhängig davon, wann der letzte Webhook lief.

type SubscriptionInfo = {
  plan: string | null;
  premiumSince: string | null;
  // Nur bei laufenden Abos gesetzt (Lifetime hat keine Periode):
  status: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

async function loadSubscriptionInfo(userId: string): Promise<SubscriptionInfo> {
  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("premium_plan, premium_since, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();

  const info: SubscriptionInfo = {
    plan: profile?.premium_plan ?? null,
    premiumSince: profile?.premium_since ?? null,
    status: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  if (profile?.stripe_subscription_id) {
    try {
      const subscription = await getStripe().subscriptions.retrieve(profile.stripe_subscription_id);
      info.status = subscription.status;
      info.cancelAtPeriodEnd = subscription.cancel_at_period_end;
      // Seit Stripe API 2025-03 liegt current_period_end auf dem Subscription-Item
      const periodEnd = subscription.items.data[0]?.current_period_end;
      if (periodEnd) info.currentPeriodEnd = new Date(periodEnd * 1000).toISOString();
    } catch (err) {
      // Abo existiert bei Stripe nicht mehr (z. B. gelöscht) - Plan-Infos aus der DB reichen dann
      if (!(err instanceof Stripe.errors.StripeError && err.statusCode === 404)) throw err;
    }
  }

  return info;
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    return NextResponse.json(await loadSubscriptionInfo(user.id));
  } catch (err) {
    console.error("Failed to load subscription details:", err);
    return NextResponse.json({ error: "Failed to load subscription details" }, { status: 500 });
  }
}

// Kündigt das Abo zum Periodenende (action: "cancel") bzw. nimmt die Kündigung
// zurück (action: "resume"). Es wird nie sofort gekündigt - der Nutzer behält
// Premium bis zum Ende des bezahlten Zeitraums; danach entzieht der Webhook
// (customer.subscription.deleted) den Premium-Status.
export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let action: unknown;
  try {
    ({ action } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (action !== "cancel" && action !== "resume") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 });
    }

    await getStripe().subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: action === "cancel",
    });

    return NextResponse.json(await loadSubscriptionInfo(user.id));
  } catch (err) {
    console.error("Failed to update subscription:", err);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
