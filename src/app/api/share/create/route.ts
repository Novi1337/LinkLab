import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

type ShareType = "tab" | "section";

type CreateShareBody = {
  type?: ShareType;
  id?: string;
};

// Schutz vor Token-Spam: maximal so viele neue Share-Links pro Nutzer und Stunde.
const MAX_TOKENS_PER_HOUR = 30;

// Share-Links laufen automatisch ab, da es (noch) keine Widerrufs-UI gibt.
const TOKEN_TTL_DAYS = 90;

function buildBaseUrl(request: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const proto = request.headers.get("x-forwarded-proto") || "https";
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (host) return `${proto}://${host}`;

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: CreateShareBody;
  try {
    body = (await request.json()) as CreateShareBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const type = body.type;
  const id = body.id?.trim();
  if (!type || !id || (type !== "tab" && type !== "section")) {
    return NextResponse.json({ error: "Ungültige Share-Anfrage" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Rate-Limit: verhindert, dass ein einzelner Account die Token-Tabelle flutet.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await admin
    .from("share_tokens")
    .select("token", { count: "exact", head: true })
    .eq("owner_user_id", user.id)
    .gte("created_at", oneHourAgo);
  if ((recentCount ?? 0) >= MAX_TOKENS_PER_HOUR) {
    return NextResponse.json(
      { error: "Zu viele Share-Links erstellt. Bitte versuche es später erneut." },
      { status: 429 }
    );
  }

  if (type === "tab") {
    const { data: tab } = await admin
      .from("tabs")
      .select("id, user_id, is_private")
      .eq("id", id)
      .maybeSingle();

    if (!tab) {
      return NextResponse.json({ error: "Reiter nicht gefunden" }, { status: 404 });
    }
    if (tab.user_id !== user.id) {
      return NextResponse.json({ error: "Keine Berechtigung für diesen Reiter" }, { status: 403 });
    }
    // Private (Inkognito-)Reiter sind bewusst vom Teilen ausgeschlossen -
    // ein versehentlicher Klick darf keine Inkognito-Inhalte nach außen geben.
    if (tab.is_private) {
      return NextResponse.json({ error: "Private Reiter können nicht geteilt werden" }, { status: 403 });
    }
  }

  if (type === "section") {
    const { data: section } = await admin
      .from("sections")
      .select("id, user_id, tab_id")
      .eq("id", id)
      .maybeSingle();

    if (!section) {
      return NextResponse.json({ error: "Abschnitt nicht gefunden" }, { status: 404 });
    }
    if (section.user_id !== user.id) {
      return NextResponse.json({ error: "Keine Berechtigung für diesen Abschnitt" }, { status: 403 });
    }
    // Abschnitte in privaten (Inkognito-)Reitern ebenfalls nicht teilbar.
    if (section.tab_id) {
      const { data: parentTab } = await admin
        .from("tabs")
        .select("is_private")
        .eq("id", section.tab_id)
        .maybeSingle();
      if (parentTab?.is_private) {
        return NextResponse.json(
          { error: "Abschnitte in privaten Reitern können nicht geteilt werden" },
          { status: 403 }
        );
      }
    }
  }

  const token = randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: insertError } =
    type === "tab"
      ? await admin.from("share_tokens").insert({
          token,
          owner_user_id: user.id,
          resource_type: "tab",
          source_tab_id: id,
          expires_at: expiresAt,
        })
      : await admin.from("share_tokens").insert({
          token,
          owner_user_id: user.id,
          resource_type: "section",
          source_section_id: id,
          expires_at: expiresAt,
        });

  if (insertError) {
    console.error("Share-Token konnte nicht gespeichert werden:", insertError);
    return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
  }

  const baseUrl = buildBaseUrl(request);
  const url = `${baseUrl}/?share=${encodeURIComponent(token)}`;
  return NextResponse.json({ url, token });
}
