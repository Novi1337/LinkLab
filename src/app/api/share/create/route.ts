import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { isTimestampActive } from "@/lib/moderation";
import {
  extractNormalizedDomainsFromLinks,
  findMatchingBlockedDomain,
  loadActiveBlockedDomainRules,
} from "@/lib/shareModeration";
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
const BLOCKED_SHARE_ERROR = "Dieser Inhalt kann nicht geteilt werden.";

type SectionRow = {
  id: string;
  user_id: string;
  parent_id: string | null;
  tab_id: string | null;
};

function buildDescendantIds(allSections: SectionRow[], rootId: string): string[] {
  const byParent = new Map<string, string[]>();
  for (const section of allSections) {
    if (!section.parent_id) continue;
    const list = byParent.get(section.parent_id) || [];
    list.push(section.id);
    byParent.set(section.parent_id, list);
  }

  const visited = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    for (const childId of byParent.get(current) || []) {
      stack.push(childId);
    }
  }

  return Array.from(visited);
}

async function loadDomainsForSectionIds(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  sectionIds: string[]
): Promise<string[]> {
  if (sectionIds.length === 0) return [];

  const { data: links, error: linksError } = await admin
    .from("links")
    .select("domain, url")
    .eq("user_id", userId)
    .in("section_id", sectionIds);

  if (linksError) {
    throw new Error(`Link-Domains konnten nicht geladen werden (${linksError.code ?? "DB"})`);
  }

  return extractNormalizedDomainsFromLinks((links || []) as Array<{ domain: string | null; url: string }>);
}

async function loadDomainsForTabShare(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  tabId: string
): Promise<string[]> {
  const { data: ownerTabs, error: ownerTabsError } = await admin
    .from("tabs")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (ownerTabsError) {
    throw new Error(`Eigene Reiter konnten nicht geladen werden (${ownerTabsError.code ?? "DB"})`);
  }

  const ownerFirstTabId = ownerTabs?.[0]?.id || null;
  let sectionQuery = admin
    .from("sections")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  sectionQuery =
    ownerFirstTabId === tabId
      ? sectionQuery.or(`tab_id.eq.${tabId},tab_id.is.null`)
      : sectionQuery.eq("tab_id", tabId);

  const { data: sections, error: sectionsError } = await sectionQuery;
  if (sectionsError) {
    throw new Error(`Sektionen des Reiters konnten nicht geladen werden (${sectionsError.code ?? "DB"})`);
  }

  return loadDomainsForSectionIds(
    admin,
    userId,
    ((sections || []) as Array<{ id: string }>).map((section) => section.id)
  );
}

async function loadDomainsForSectionShare(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  sectionId: string
): Promise<string[]> {
  const { data: allSections, error: sectionsError } = await admin
    .from("sections")
    .select("id, user_id, parent_id, tab_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (sectionsError || !allSections) {
    throw new Error(`Sektionen konnten nicht geladen werden (${sectionsError?.code ?? "DB"})`);
  }

  const sectionRows = allSections as SectionRow[];
  const root = sectionRows.find((section) => section.id === sectionId);
  if (!root) return [];

  const descendantIds = buildDescendantIds(sectionRows, sectionId);
  return loadDomainsForSectionIds(admin, userId, descendantIds);
}

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

  try {
    const admin = getSupabaseAdmin();

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("share_handle, sharing_disabled_until, suspended_until, account_status")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Profil konnte nicht geladen werden:", profileError);
      return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
    }

    if (!profile?.share_handle) {
      return NextResponse.json(
        { error: "Bitte zuerst in den Kontoeinstellungen einen Share-Handle festlegen." },
        { status: 400 }
      );
    }

    if (
      isTimestampActive(profile?.sharing_disabled_until) ||
      isTimestampActive(profile?.suspended_until) ||
      profile?.account_status === "suspended"
    ) {
      return NextResponse.json({ error: BLOCKED_SHARE_ERROR }, { status: 403 });
    }

    // Rate-Limit: verhindert, dass ein einzelner Account die Token-Tabelle flutet.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount, error: rateLimitError } = await admin
      .from("share_tokens")
      .select("token", { count: "exact", head: true })
      .eq("owner_user_id", user.id)
      .gte("created_at", oneHourAgo);
    if (rateLimitError) {
      console.error("Share-Rate-Limit konnte nicht geprüft werden:", rateLimitError);
      return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
    }
    if ((recentCount ?? 0) >= MAX_TOKENS_PER_HOUR) {
      return NextResponse.json(
        { error: "Zu viele Share-Links erstellt. Bitte versuche es später erneut." },
        { status: 429 }
      );
    }

    if (type === "tab") {
      const { data: tab, error: tabError } = await admin
        .from("tabs")
        .select("id, user_id, is_private")
        .eq("id", id)
        .maybeSingle();

      if (tabError) {
        console.error("Reiter konnte nicht geprüft werden:", tabError);
        return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
      }
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
      const { data: section, error: sectionError } = await admin
        .from("sections")
        .select("id, user_id, tab_id")
        .eq("id", id)
        .maybeSingle();

      if (sectionError) {
        console.error("Abschnitt konnte nicht geprüft werden:", sectionError);
        return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
      }
      if (!section) {
        return NextResponse.json({ error: "Abschnitt nicht gefunden" }, { status: 404 });
      }
      if (section.user_id !== user.id) {
        return NextResponse.json({ error: "Keine Berechtigung für diesen Abschnitt" }, { status: 403 });
      }
      // Abschnitte in privaten (Inkognito-)Reitern ebenfalls nicht teilbar.
      if (section.tab_id) {
        const { data: parentTab, error: parentTabError } = await admin
          .from("tabs")
          .select("is_private")
          .eq("id", section.tab_id)
          .maybeSingle();
        if (parentTabError) {
          console.error("Parent-Reiter konnte nicht geprüft werden:", parentTabError);
          return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
        }
        if (parentTab?.is_private) {
          return NextResponse.json(
            { error: "Abschnitte in privaten Reitern können nicht geteilt werden" },
            { status: 403 }
          );
        }
      }
    }

    const domainsToCheck =
      type === "tab"
        ? await loadDomainsForTabShare(admin, user.id, id)
        : await loadDomainsForSectionShare(admin, user.id, id);
    const blockedRules = await loadActiveBlockedDomainRules(admin);
    const blockedDomain = findMatchingBlockedDomain(domainsToCheck, blockedRules);
    if (blockedDomain) {
      console.warn("Share-Erstellung wegen blockierter Domain verhindert:", {
        userId: user.id,
        type,
        resourceId: id,
        blockedDomain,
      });
      return NextResponse.json({ error: BLOCKED_SHARE_ERROR }, { status: 403 });
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
  } catch (error) {
    console.error("Share-Erstellung fehlgeschlagen:", error);
    return NextResponse.json({ error: "Share-Link konnte nicht erstellt werden" }, { status: 500 });
  }
}
