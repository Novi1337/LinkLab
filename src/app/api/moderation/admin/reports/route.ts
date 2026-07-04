import { NextResponse } from "next/server";
import { getAdminFromRequest, getSupabaseAdmin } from "@/lib/stripe";
import {
  isModerationReportStatus,
  MODERATION_REPORT_STATUSES,
  type ModerationReportStatus,
  normalizeDomain,
} from "@/lib/moderation";

const DEFAULT_STATUSES: ModerationReportStatus[] = ["open", "in_review"];

function parseStatuses(value: string | null): ModerationReportStatus[] | null {
  if (!value) return DEFAULT_STATUSES;
  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parsed.length === 0) return DEFAULT_STATUSES;
  if (!parsed.every((status) => isModerationReportStatus(status))) return null;
  return parsed as ModerationReportStatus[];
}

function computeTopDomains(rows: Array<{ domain: string | null }>, limit: number) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const normalized = normalizeDomain(row.domain);
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([domain, count]) => ({ domain, count }));
}

export async function GET(request: Request) {
  const adminUser = await getAdminFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });
  }

  const url = new URL(request.url);
  const statuses = parseStatuses(url.searchParams.get("status"));
  if (!statuses) {
    return NextResponse.json(
      { error: `Ungültiger status-Filter. Erlaubt: ${MODERATION_REPORT_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const includeDashboard = url.searchParams.get("includeDashboard") === "1";

  try {
    const admin = getSupabaseAdmin();
    let reportsQuery = admin
      .from("moderation_reports")
      .select(
        "id, reporter_user_id, resource_type, resource_id, reason_code, details, reported_domain, reported_url, status, created_at, reviewed_by_admin_id, reviewed_at, action_note"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    reportsQuery =
      statuses.length === 1 ? reportsQuery.eq("status", statuses[0]) : reportsQuery.in("status", statuses);

    const { data: reports, error: reportsError } = await reportsQuery;
    if (reportsError) {
      console.error("Moderation-Reports konnten nicht geladen werden:", reportsError);
      return NextResponse.json({ error: "Reports konnten nicht geladen werden" }, { status: 500 });
    }

    if (!includeDashboard) {
      return NextResponse.json({ reports: reports || [] });
    }

    const nowIso = new Date().toISOString();
    const [revokedResult, restrictedUsersResult, blockedDomainsResult, domainsResult] = await Promise.all([
      admin
        .from("share_tokens")
        .select("token, owner_user_id, revoked_reason, revoked_at, revoked_by_admin_id")
        .eq("revoked", true)
        .order("revoked_at", { ascending: false })
        .limit(30),
      admin
        .from("profiles")
        .select("id, sharing_disabled_until, suspended_until, account_status")
        .or(
          `sharing_disabled_until.gt.${nowIso},suspended_until.gt.${nowIso},account_status.eq.suspended`
        )
        .order("created_at", { ascending: false })
        .limit(50),
      admin
        .from("blocked_domains")
        .select("id, domain_pattern, block_scope, reason, blocked_by_admin_id, created_at, lifted_at")
        .is("lifted_at", null)
        .order("created_at", { ascending: false })
        .limit(100),
      admin.from("links").select("domain").not("domain", "is", null).limit(5000),
    ]);

    if (revokedResult.error || restrictedUsersResult.error || blockedDomainsResult.error || domainsResult.error) {
      console.error("Moderation-Dashboard-Daten konnten nicht geladen werden:", {
        revoked: revokedResult.error,
        restrictedUsers: restrictedUsersResult.error,
        blockedDomains: blockedDomainsResult.error,
        domains: domainsResult.error,
      });
      return NextResponse.json({ error: "Dashboard-Daten konnten nicht geladen werden" }, { status: 500 });
    }

    return NextResponse.json({
      reports: reports || [],
      recentRevokedShares: revokedResult.data || [],
      restrictedUsers: restrictedUsersResult.data || [],
      blockedDomains: blockedDomainsResult.data || [],
      topDomains: computeTopDomains((domainsResult.data as Array<{ domain: string | null }>) || [], 20),
    });
  } catch (error) {
    console.error("Moderation-Admin-Reports fehlgeschlagen:", error);
    return NextResponse.json({ error: "Reports konnten nicht geladen werden" }, { status: 500 });
  }
}
