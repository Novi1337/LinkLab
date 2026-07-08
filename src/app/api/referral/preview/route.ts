import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/stripe";

// Öffentlicher, nicht-authentifizierter Endpunkt für die personalisierte
// Einladungsseite (/invite/[code]): liefert NUR den Anzeigenamen des Werbers
// (share_nickname, ohnehin für Share-Labels gedacht) und die Anzahl Tage, die
// ein neu registrierter Freund geschenkt bekommt - keine weitere PII.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawCode = searchParams.get("code") || "";
  if (!/^[A-Za-z0-9]{4,16}$/.test(rawCode)) {
    return NextResponse.json({ error: "Ungültiger Referral-Code" }, { status: 400 });
  }
  const normalized = rawCode.toUpperCase();

  const admin = getSupabaseAdmin();
  const { data: referrer, error } = await admin
    .from("profiles")
    .select("share_nickname, premium_plan")
    .eq("referral_code", normalized)
    .maybeSingle();

  if (error) {
    console.error("Referral-Preview konnte nicht geladen werden:", error);
    return NextResponse.json({ error: "Vorschau konnte nicht geladen werden" }, { status: 500 });
  }
  if (!referrer) {
    return NextResponse.json({ error: "Referral-Code nicht gefunden" }, { status: 404 });
  }

  const refereeDays = referrer.premium_plan === "premium" || referrer.premium_plan === "lifetime" ? 45 : 30;

  return NextResponse.json({
    displayName: referrer.share_nickname?.trim() || null,
    refereeDays,
  });
}
