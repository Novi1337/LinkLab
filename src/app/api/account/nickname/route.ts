import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

type NicknameBody = {
  nickname?: string;
};

const MAX_NICKNAME_LENGTH = 32;

function normalizeNickname(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const collapsed = input.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  if (collapsed.length > MAX_NICKNAME_LENGTH) return null;
  return collapsed;
}

export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .select("share_nickname")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Nickname konnte nicht geladen werden:", error);
      return NextResponse.json({ error: "Nickname konnte nicht geladen werden" }, { status: 500 });
    }

    return NextResponse.json({ nickname: data?.share_nickname ?? null });
  } catch (err) {
    console.error("Nickname-GET fehlgeschlagen:", err);
    return NextResponse.json({ error: "Nickname konnte nicht geladen werden" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: NicknameBody;
  try {
    body = (await request.json()) as NicknameBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const raw = body.nickname;
  const normalized = normalizeNickname(raw);
  if (typeof raw === "string" && raw.trim() && !normalized) {
    return NextResponse.json(
      { error: `Nickname ist ungültig (maximal ${MAX_NICKNAME_LENGTH} Zeichen)` },
      { status: 400 }
    );
  }

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("profiles")
      .upsert({ id: user.id, share_nickname: normalized }, { onConflict: "id" })
      .select("share_nickname")
      .single();

    if (error) {
      console.error("Nickname konnte nicht gespeichert werden:", error);
      return NextResponse.json({ error: "Nickname konnte nicht gespeichert werden" }, { status: 500 });
    }

    return NextResponse.json({ nickname: data?.share_nickname ?? null });
  } catch (err) {
    console.error("Nickname-POST fehlgeschlagen:", err);
    return NextResponse.json({ error: "Nickname konnte nicht gespeichert werden" }, { status: 500 });
  }
}
