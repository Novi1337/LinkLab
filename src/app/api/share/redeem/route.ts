import { NextResponse } from "next/server";
import { isTimestampActive } from "@/lib/moderation";
import {
  extractNormalizedDomainsFromLinks,
  findMatchingBlockedDomain,
  loadActiveBlockedDomainRules,
  type BlockedDomainRule,
} from "@/lib/shareModeration";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";

type RedeemBody = {
  token?: string;
};

const UNAVAILABLE_SHARE_ERROR = "Share-Link ist derzeit nicht verfügbar";

type ShareTokenRow = {
  token: string;
  owner_user_id: string;
  resource_type: "tab" | "section";
  source_tab_id: string | null;
  source_section_id: string | null;
  revoked: boolean;
  revoked_reason: string | null;
  revoked_at: string | null;
  revoked_by_admin_id: string | null;
  expires_at: string | null;
};

type TabRow = {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  is_private: boolean;
  shared_from_label?: string | null;
  shared_from_email?: string | null;
  shared_from_handle?: string | null;
};

type SectionRow = {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  tab_id: string | null;
  color: string | null;
  shared_from_label?: string | null;
  shared_from_email?: string | null;
  shared_from_handle?: string | null;
};

type LinkRow = {
  id: string;
  section_id: string;
  user_id: string;
  url: string;
  title: string;
  description: string | null;
  image: string | null;
  initial: string | null;
  domain: string | null;
};

function buildDescendantIds(allSections: SectionRow[], rootId: string): Set<string> {
  const children = new Map<string, SectionRow[]>();
  for (const section of allSections) {
    if (!section.parent_id) continue;
    const list = children.get(section.parent_id) || [];
    list.push(section);
    children.set(section.parent_id, list);
  }

  const ids = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || ids.has(current)) continue;
    ids.add(current);
    for (const child of children.get(current) || []) {
      stack.push(child.id);
    }
  }
  return ids;
}

async function ensureSharedTab(admin: ReturnType<typeof getSupabaseAdmin>, userId: string): Promise<string> {
  const { data: existing } = await admin
    .from("tabs")
    .select("id")
    .eq("user_id", userId)
    .eq("name", "Geteilte Inhalte")
    .eq("is_private", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await admin
    .from("tabs")
    .insert({ user_id: userId, name: "Geteilte Inhalte", is_private: false })
    .select("id")
    .single();

  if (error || !created?.id) {
    throw new Error("Geteilter Ziel-Reiter konnte nicht angelegt werden");
  }
  return created.id;
}

async function cloneSectionsAndLinks(params: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  recipientUserId: string;
  sourceSections: SectionRow[];
  sourceLinks: LinkRow[];
  targetTabId: string;
  rootSourceSectionIds: string[];
  sharedFromLabel: string;
  sharedFromEmail: string | null;
  sharedFromHandle: string | null;
}): Promise<void> {
  const {
    admin,
    recipientUserId,
    sourceSections,
    sourceLinks,
    targetTabId,
    rootSourceSectionIds,
    sharedFromLabel,
    sharedFromEmail,
    sharedFromHandle,
  } = params;

  const byParent = new Map<string | null, SectionRow[]>();
  for (const section of sourceSections) {
    const key = section.parent_id;
    const list = byParent.get(key) || [];
    list.push(section);
    byParent.set(key, list);
  }

  const sourceToTargetSectionId = new Map<string, string>();

  const cloneSectionRecursive = async (sourceSection: SectionRow, newParentId: string | null) => {
    // Zyklus-Schutz: bereits kopierte Sektionen nie erneut besuchen, selbst wenn
    // die parent_id-Kette in der Quelle (durch manipulierte Daten) einen Kreis bildet.
    if (sourceToTargetSectionId.has(sourceSection.id)) return;

    const { data: insertedSection, error: insertSectionError } = await admin
      .from("sections")
      .insert({
        user_id: recipientUserId,
        name: sourceSection.name,
        color: sourceSection.color,
        shared_from_label: sharedFromLabel,
        shared_from_email: sharedFromEmail,
        shared_from_handle: sharedFromHandle,
        parent_id: newParentId,
        tab_id: targetTabId,
      })
      .select("id")
      .single();

    if (insertSectionError || !insertedSection?.id) {
      throw new Error("Sektion konnte nicht kopiert werden");
    }

    sourceToTargetSectionId.set(sourceSection.id, insertedSection.id);

    for (const child of byParent.get(sourceSection.id) || []) {
      await cloneSectionRecursive(child, insertedSection.id);
    }
  };

  for (const rootId of rootSourceSectionIds) {
    const root = sourceSections.find((s) => s.id === rootId);
    if (root) {
      await cloneSectionRecursive(root, null);
    }
  }

  const linksToInsert = sourceLinks
    .map((sourceLink) => {
      const newSectionId = sourceToTargetSectionId.get(sourceLink.section_id);
      if (!newSectionId) return null;
      return {
        user_id: recipientUserId,
        section_id: newSectionId,
        url: sourceLink.url,
        title: sourceLink.title,
        description: sourceLink.description,
        image: sourceLink.image,
        initial: sourceLink.initial,
        domain: sourceLink.domain,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (linksToInsert.length > 0) {
    const { error: insertLinksError } = await admin.from("links").insert(linksToInsert);
    if (insertLinksError) {
      throw new Error("Links konnten nicht kopiert werden");
    }
  }
}

async function redeemSharedTab(params: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  ownerUserId: string;
  recipientUserId: string;
  sourceTabId: string;
  blockedDomainRules: BlockedDomainRule[];
  sharedFromLabel: string;
  sharedFromEmail: string | null;
  sharedFromHandle: string | null;
}): Promise<string> {
  const {
    admin,
    ownerUserId,
    recipientUserId,
    sourceTabId,
    blockedDomainRules,
    sharedFromLabel,
    sharedFromEmail,
    sharedFromHandle,
  } = params;

  const { data: sourceTab } = await admin
    .from("tabs")
    .select("id, user_id, name, color, is_private")
    .eq("id", sourceTabId)
    .maybeSingle();
  const sourceTabRow = sourceTab as TabRow | null;
  if (!sourceTabRow || sourceTabRow.user_id !== ownerUserId) {
    throw new Error("Geteilter Reiter wurde nicht gefunden");
  }

  const { data: ownerTabs } = await admin
    .from("tabs")
    .select("id")
    .eq("user_id", ownerUserId)
    .order("created_at", { ascending: true });
  const ownerFirstTabId = ownerTabs?.[0]?.id || null;

  const sectionQuery = admin
    .from("sections")
    .select("id, user_id, name, parent_id, tab_id, color")
    .eq("user_id", ownerUserId)
    .order("created_at", { ascending: true });

  const { data: sourceSections, error: sectionError } = ownerFirstTabId === sourceTabId
    ? await sectionQuery.or(`tab_id.eq.${sourceTabId},tab_id.is.null`)
    : await sectionQuery.eq("tab_id", sourceTabId);

  if (sectionError) throw new Error("Sektionen des geteilten Reiters konnten nicht geladen werden");

  const sectionIds = (sourceSections || []).map((s) => s.id);
  const { data: sourceLinks, error: linksError } = sectionIds.length
    ? await admin
        .from("links")
        .select("id, section_id, user_id, url, title, description, image, initial, domain")
        .eq("user_id", ownerUserId)
        .in("section_id", sectionIds)
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (linksError) throw new Error("Links des geteilten Reiters konnten nicht geladen werden");

  const blockedDomain = findMatchingBlockedDomain(
    extractNormalizedDomainsFromLinks((sourceLinks || []) as Array<{ domain: string | null; url: string }>),
    blockedDomainRules
  );
  if (blockedDomain) {
    throw new Error(UNAVAILABLE_SHARE_ERROR);
  }

  const { data: targetTab, error: targetTabError } = await admin
    .from("tabs")
    .insert({
      user_id: recipientUserId,
      name: `${sourceTabRow.name} (geteilt)`,
      color: sourceTabRow.color,
      shared_from_label: sharedFromLabel,
      shared_from_email: sharedFromEmail,
      shared_from_handle: sharedFromHandle,
      is_private: false,
    })
    .select("id")
    .single();

  if (targetTabError || !targetTab?.id) {
    throw new Error("Geteilter Reiter konnte nicht erstellt werden");
  }

  const rootIds = (sourceSections || []).filter((s) => !s.parent_id).map((s) => s.id);
  await cloneSectionsAndLinks({
    admin,
    recipientUserId,
    sourceSections: sourceSections || [],
    sourceLinks: sourceLinks || [],
    targetTabId: targetTab.id,
    rootSourceSectionIds: rootIds,
    sharedFromLabel,
    sharedFromEmail,
    sharedFromHandle,
  });

  return targetTab.id;
}

async function redeemSharedSection(params: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  ownerUserId: string;
  recipientUserId: string;
  sourceSectionId: string;
  blockedDomainRules: BlockedDomainRule[];
  sharedFromLabel: string;
  sharedFromEmail: string | null;
  sharedFromHandle: string | null;
}): Promise<string> {
  const {
    admin,
    ownerUserId,
    recipientUserId,
    sourceSectionId,
    blockedDomainRules,
    sharedFromLabel,
    sharedFromEmail,
    sharedFromHandle,
  } = params;

  const { data: allSections, error: allSectionsError } = await admin
    .from("sections")
    .select("id, user_id, name, parent_id, tab_id, color")
    .eq("user_id", ownerUserId)
    .order("created_at", { ascending: true });
  if (allSectionsError || !allSections) {
    throw new Error("Abschnitte des geteilten Inhalts konnten nicht geladen werden");
  }

  const root = allSections.find((s) => s.id === sourceSectionId);
  if (!root || root.user_id !== ownerUserId) {
    throw new Error("Geteilter Abschnitt wurde nicht gefunden");
  }

  const descendantIds = buildDescendantIds(allSections, sourceSectionId);
  const selectedSections = allSections.filter((s) => descendantIds.has(s.id));

  const { data: sourceLinks, error: linksError } = descendantIds.size
    ? await admin
        .from("links")
        .select("id, section_id, user_id, url, title, description, image, initial, domain")
        .eq("user_id", ownerUserId)
        .in("section_id", Array.from(descendantIds))
        .order("created_at", { ascending: true })
    : { data: [], error: null };

  if (linksError) {
    throw new Error("Links des geteilten Abschnitts konnten nicht geladen werden");
  }

  const blockedDomain = findMatchingBlockedDomain(
    extractNormalizedDomainsFromLinks((sourceLinks || []) as Array<{ domain: string | null; url: string }>),
    blockedDomainRules
  );
  if (blockedDomain) {
    throw new Error(UNAVAILABLE_SHARE_ERROR);
  }

  const targetTabId = await ensureSharedTab(admin, recipientUserId);

  await cloneSectionsAndLinks({
    admin,
    recipientUserId,
    sourceSections: selectedSections,
    sourceLinks: sourceLinks || [],
    targetTabId,
    rootSourceSectionIds: [sourceSectionId],
    sharedFromLabel,
    sharedFromEmail,
    sharedFromHandle,
  });

  return targetTabId;
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: RedeemBody;
  try {
    body = (await request.json()) as RedeemBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token || !/^[A-Za-z0-9_-]{12,256}$/.test(token)) {
    return NextResponse.json({ error: "Ungültiger Share-Token" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: shareToken, error: tokenError } = await admin
    .from("share_tokens")
    .select(
      "token, owner_user_id, resource_type, source_tab_id, source_section_id, revoked, revoked_reason, revoked_at, revoked_by_admin_id, expires_at"
    )
    .eq("token", token)
    .maybeSingle();

  const shareTokenRow = shareToken as ShareTokenRow | null;

  if (tokenError) {
    console.error("Share-Token konnte nicht geladen werden:", tokenError);
    return NextResponse.json({ error: "Share-Link konnte nicht geprüft werden" }, { status: 500 });
  }
  if (
    !shareTokenRow ||
    shareTokenRow.revoked ||
    !!shareTokenRow.revoked_at ||
    (shareTokenRow.expires_at && new Date(shareTokenRow.expires_at) < new Date())
  ) {
    return NextResponse.json({ error: "Share-Link ist ungültig oder abgelaufen" }, { status: 404 });
  }

  if (shareTokenRow.owner_user_id === user.id) {
    return NextResponse.json({ error: "Eigene Share-Links können nicht eingelöst werden" }, { status: 400 });
  }

  const { data: ownerUser, error: ownerUserError } = await admin.auth.admin.getUserById(
    shareTokenRow.owner_user_id
  );
  if (ownerUserError) {
    console.error("Share-Owner konnte nicht geladen werden:", ownerUserError);
    return NextResponse.json({ error: "Share-Link konnte nicht geprüft werden" }, { status: 500 });
  }
  const ownerEmail = ownerUser.user?.email?.trim() || null;
  const { data: ownerProfile, error: ownerProfileError } = await admin
    .from("profiles")
    .select("share_nickname, share_handle, sharing_disabled_until, suspended_until, account_status")
    .eq("id", shareTokenRow.owner_user_id)
    .maybeSingle();
  if (ownerProfileError) {
    console.error("Share-Owner-Profil konnte nicht geladen werden:", ownerProfileError);
    return NextResponse.json({ error: "Share-Link konnte nicht geprüft werden" }, { status: 500 });
  }
  if (
    isTimestampActive(ownerProfile?.sharing_disabled_until) ||
    isTimestampActive(ownerProfile?.suspended_until) ||
    ownerProfile?.account_status === "suspended"
  ) {
    return NextResponse.json({ error: UNAVAILABLE_SHARE_ERROR }, { status: 403 });
  }
  const ownerHandle = ownerProfile?.share_handle?.trim() || null;
  const ownerNickname = ownerProfile?.share_nickname?.trim() || null;
  const sharedBy = ownerNickname || ownerHandle || ownerEmail;
  const sharedFromLabel = sharedBy
    ? `Geteilt von ${sharedBy}${ownerHandle && ownerHandle !== sharedBy ? ` (@${ownerHandle})` : ""}`
    : "Geteilt";

  // Einlösung ZUERST atomar registrieren (Primary Key = token + Empfänger):
  // Parallele Requests desselben Nutzers können so nicht doppelt klonen -
  // der zweite Insert schlägt mit Unique-Violation (23505) fehl.
  const { error: redemptionInsertError } = await admin
    .from("share_redemptions")
    .insert({ token, recipient_user_id: user.id });

  if (redemptionInsertError) {
    if (redemptionInsertError.code === "23505") {
      return NextResponse.json({ alreadyRedeemed: true });
    }
    console.error("Share-Redemption konnte nicht gespeichert werden:", redemptionInsertError);
    return NextResponse.json({ error: "Share-Link konnte nicht eingelöst werden" }, { status: 500 });
  }

  try {
    const blockedDomainRules = await loadActiveBlockedDomainRules(admin);
    let targetTabId = "";

    if (shareTokenRow.resource_type === "tab") {
      if (!shareTokenRow.source_tab_id) {
        return NextResponse.json({ error: "Ungültiger Share-Link" }, { status: 400 });
      }
      targetTabId = await redeemSharedTab({
        admin,
        ownerUserId: shareTokenRow.owner_user_id,
        recipientUserId: user.id,
        sourceTabId: shareTokenRow.source_tab_id,
        blockedDomainRules,
        sharedFromLabel,
        sharedFromEmail: ownerEmail,
        sharedFromHandle: ownerHandle,
      });
    } else if (shareTokenRow.resource_type === "section") {
      if (!shareTokenRow.source_section_id) {
        return NextResponse.json({ error: "Ungültiger Share-Link" }, { status: 400 });
      }
      targetTabId = await redeemSharedSection({
        admin,
        ownerUserId: shareTokenRow.owner_user_id,
        recipientUserId: user.id,
        sourceSectionId: shareTokenRow.source_section_id,
        blockedDomainRules,
        sharedFromLabel,
        sharedFromEmail: ownerEmail,
        sharedFromHandle: ownerHandle,
      });
    } else {
      return NextResponse.json({ error: "Unbekannter Share-Typ" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, targetTabId });
  } catch (error) {
    console.error("Share-Link konnte nicht eingelöst werden:", error);
    // Klonen fehlgeschlagen -> Einlösung zurücknehmen, damit ein erneuter Versuch möglich ist
    await admin
      .from("share_redemptions")
      .delete()
      .eq("token", token)
      .eq("recipient_user_id", user.id);
    const message = error instanceof Error ? error.message : "";
    if (message === UNAVAILABLE_SHARE_ERROR) {
      return NextResponse.json({ error: UNAVAILABLE_SHARE_ERROR }, { status: 403 });
    }
    return NextResponse.json({ error: "Geteilter Inhalt konnte nicht übernommen werden" }, { status: 500 });
  }
}
