import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, getSupabaseAdmin } from "@/lib/stripe";

// Stripe-Webhook: Einzige Stelle, an der der Premium-Status gesetzt/entzogen wird.
// Die Signaturprüfung stellt sicher, dass nur echte Stripe-Events akzeptiert werden -
// niemand kann sich Premium durch einen gefälschten POST erschleichen.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook is not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const body = await request.text();
    event = await getStripe().webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();

  try {
    switch (event.type) {
      // Kauf abgeschlossen (Abo ODER Lifetime-Einmalzahlung)
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan;
        if (!userId || !plan) break;

        // Bestehendes Abo merken: Beim Upgrade auf Lifetime wird es danach beendet,
        // damit der Kunde nicht weiter jährlich zahlt.
        const { data: existing } = await supabaseAdmin
          .from("profiles")
          .select("stripe_subscription_id")
          .eq("id", userId)
          .maybeSingle();

        await supabaseAdmin.from("profiles").upsert(
          {
            id: userId,
            stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id,
            premium_plan: plan,
            premium_since: new Date().toISOString(),
            stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
          },
          { onConflict: "id" }
        );

        if (plan === "lifetime" && existing?.stripe_subscription_id) {
          try {
            await getStripe().subscriptions.cancel(existing.stripe_subscription_id);
          } catch (err) {
            // Abo existiert evtl. schon nicht mehr - Lifetime ist trotzdem aktiv
            console.error("Failed to cancel old subscription after Lifetime purchase:", err);
          }
        }
        break;
      }

      // Abo gekündigt/abgelaufen -> Premium entziehen (Lifetime bleibt unberührt,
      // da Lifetime-Käufe keine Subscription haben)
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await supabaseAdmin
          .from("profiles")
          .update({ premium_plan: null, stripe_subscription_id: null })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }

      // Zahlung wiederholt fehlgeschlagen -> Stripe setzt das Abo auf "unpaid"/"canceled".
      // Wir reagieren erst auf die endgültige Kündigung (Event oben), aber loggen den Fall.
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.warn("Stripe: payment failed for customer", invoice.customer);
        break;
      }

      default:
        // Nicht relevante Events einfach bestätigen
        break;
    }
  } catch (err) {
    console.error(`Webhook processing failed (${event.type}):`, err);
    // 500 zurückgeben, damit Stripe den Event erneut zustellt
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
