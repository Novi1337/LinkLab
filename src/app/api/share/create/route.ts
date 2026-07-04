import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

type ShareType = "tab" | "section";

type CreateShareBody = {
  type?: ShareType;
  id?: string;
};

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

  if (type === "tab") {
    const { data: tab } = await admin
      .from("tabs")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!tab) {
      return NextResponse.json({ error: "Reiter nicht gefunden" }, { status: 404 });
    }
    if (tab.user_id !== user.id) {
      return NextResponse.json({ error: "Keine Berechtigung für diesen Reiter" }, { status: 403 });
    }
  }

  if (type === "section") {
    const { data: section } = await admin
      .from("sections")
      .select("id, user_id")
      .eq("id", id)
      .maybeSingle();

    if (!section) {
      return NextResponse.json({ error: "Abschnitt nicht gefunden" }, { status: 404 });
    }
    if (section.user_id !== user.id) {
      return NextResponse.json({ error: "Keine Berechtigung für diesen Abschnitt" }, { status: 403 });
    }
  }

  const token = randomBytes(24).toString("base64url");
  const { error: insertError } =
    type === "tab"
      ? await admin.from("share_tokens").insert({
          token,
          owner_user_id: user.id,
          resource_type: "tab",
          source_tab_id: id,
        })
      : await admin.from("share_tokens").insert({
          token,
          owner_user_id: user.id,
          resource_type: "section",
          source_section_id: id,
        });

  if (insertError) {
    console.error("Share-Token konnte nicht gespeichert werden:", insertError);
    return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
  }

  const baseUrl = buildBaseUrl(request);
  const url = `${baseUrl}/?share=${encodeURIComponent(token)}`;
  return NextResponse.json({ url, token });
}
