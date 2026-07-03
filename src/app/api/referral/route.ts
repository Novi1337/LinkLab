import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

// Empfehlungsprogramm:
// GET  -> eigenen Referral-Code (wird bei Bedarf erzeugt) + Statistik laden
// POST -> Referral-Code nach der Registrierung einlösen; der Werbende erhält
//         für die ERSTE erfolgreiche Empfehlung 3 Monate Premium.
//
// Alle Schreibzugriffe laufen über den Service-Role-Key - Clients können die
// Referral-Spalten nicht direkt manipulieren (Spaltenrechte, siehe supabase/referrals.sql).

const REWARD_MONTHS = 3;

// Nur frisch registrierte Accounts dürfen einen Code einlösen - verhindert,
// dass sich Bestandsnutzer gegenseitig Prämien zuschieben.
const MAX_ACCOUNT_AGE_MS = 48 * 60 * 60 * 1000;

// Gut lesbarer 8-stelliger Code ohne verwechselbare Zeichen (0/O, 1/I/L)
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function generateReferralCode(): string {
  const bytes = randomBytes(8);
  let code = "";
  for (const b of bytes) code += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return code;
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("referral_code, referral_reward_granted, referral_premium_until")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("Referral-Profil konnte nicht geladen werden:", error);
    return NextResponse.json({ error: "Referral-Daten konnten nicht geladen werden" }, { status: 500 });
  }

  // Code bei Bedarf erzeugen (mit Retry, falls der zufällige Code kollidiert)
  let code = profile?.referral_code ?? null;
  if (!code) {
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateReferralCode();
      const { error: upsertError } = await admin
        .from("profiles")
        .upsert({ id: user.id, referral_code: candidate }, { onConflict: "id" });
      if (!upsertError) {
        code = candidate;
      } else if (upsertError.code !== "23505") {
        // 23505 = Unique-Kollision -> einfach neuen Code versuchen
        console.error("Referral-Code konnte nicht gespeichert werden:", upsertError);
        return NextResponse.json({ error: "Referral-Code konnte nicht erstellt werden" }, { status: 500 });
      }
    }
    if (!code) {
      return NextResponse.json({ error: "Referral-Code konnte nicht erstellt werden" }, { status: 500 });
    }
  }

  const { count } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", user.id);

  return NextResponse.json({
    code,
    referralCount: count ?? 0,
    rewardGranted: profile?.referral_reward_granted ?? false,
    premiumUntil: profile?.referral_premium_until ?? null,
  });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  let code: unknown;
  try {
    ({ code } = await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }
  if (typeof code !== "string" || !/^[A-Za-z0-9]{4,16}$/.test(code.trim())) {
    return NextResponse.json({ error: "Ungültiger Referral-Code" }, { status: 400 });
  }
  const normalized = code.trim().toUpperCase();

  // Nur neue Accounts dürfen Codes einlösen
  if (Date.now() - new Date(user.created_at).getTime() > MAX_ACCOUNT_AGE_MS) {
    return NextResponse.json(
      { error: "Referral-Codes können nur direkt nach der Registrierung eingelöst werden" },
      { status: 403 }
    );
  }

  const admin = getSupabaseAdmin();

  const { data: referrer } = await admin
    .from("profiles")
    .select("id, referral_reward_granted")
    .eq("referral_code", normalized)
    .maybeSingle();
  if (!referrer) {
    return NextResponse.json({ error: "Referral-Code nicht gefunden" }, { status: 404 });
  }
  if (referrer.id === user.id) {
    return NextResponse.json({ error: "Der eigene Code kann nicht eingelöst werden" }, { status: 400 });
  }

  // Jeder Account kann nur EINMAL geworben werden
  const { data: ownProfile } = await admin
    .from("profiles")
    .select("id, referred_by")
    .eq("id", user.id)
    .maybeSingle();
  if (ownProfile?.referred_by) {
    return NextResponse.json({ error: "Für diesen Account wurde bereits ein Code eingelöst" }, { status: 409 });
  }

  if (ownProfile) {
    // Bedingtes Update verhindert Doppel-Einlösung bei parallelen Requests
    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", user.id)
      .is("referred_by", null)
      .select("id");
    if (updateError || !updated?.length) {
      return NextResponse.json({ error: "Code konnte nicht eingelöst werden" }, { status: 409 });
    }
  } else {
    const { error: insertError } = await admin
      .from("profiles")
      .insert({ id: user.id, referred_by: referrer.id });
    if (insertError) {
      return NextResponse.json({ error: "Code konnte nicht eingelöst werden" }, { status: 409 });
    }
  }

  // Prämie: 3 Monate Premium für die ERSTE erfolgreiche Empfehlung.
  // Das bedingte Update stellt sicher, dass die Prämie genau einmal vergeben wird.
  if (!referrer.referral_reward_granted) {
    const until = new Date();
    until.setMonth(until.getMonth() + REWARD_MONTHS);
    const { error: rewardError } = await admin
      .from("profiles")
      .update({ referral_reward_granted: true, referral_premium_until: until.toISOString() })
      .eq("id", referrer.id)
      .eq("referral_reward_granted", false);
    if (rewardError) {
      console.error("Referral-Prämie konnte nicht gutgeschrieben werden:", rewardError);
    }
  }

  return NextResponse.json({ ok: true });
}
