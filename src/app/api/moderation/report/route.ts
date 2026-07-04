import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";
import {
  isModerationReasonCode,
  isModerationResourceType,
  normalizeDomain,
} from "@/lib/moderation";

type ReportBody = {
  resourceType?: unknown;
  resourceId?: unknown;
  reasonCode?: unknown;
  details?: unknown;
  domain?: unknown;
  url?: unknown;
};

const REPORT_DETAILS_MAX_LENGTH = 1000;
const REPORT_RATE_LIMIT_HOURS = 24;
const RESOURCE_ID_RE = /^[A-Za-z0-9_-]{3,256}$/;

function normalizeResourceId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!RESOURCE_ID_RE.test(trimmed)) return null;
  return trimmed;
}

function normalizeDetails(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > REPORT_DETAILS_MAX_LENGTH) return null;
  return trimmed;
}

function normalizeReportUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: ReportBody;
  try {
    body = (await request.json()) as ReportBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  if (!isModerationResourceType(body.resourceType)) {
    return NextResponse.json({ error: "Ungültiger Ressourcentyp" }, { status: 400 });
  }

  const resourceId = normalizeResourceId(body.resourceId);
  if (!resourceId) {
    return NextResponse.json({ error: "Ungültige Ressourcen-ID" }, { status: 400 });
  }

  if (!isModerationReasonCode(body.reasonCode)) {
    return NextResponse.json({ error: "Ungültiger Meldegrund" }, { status: 400 });
  }

  const details = normalizeDetails(body.details);
  if (typeof body.details === "string" && body.details.trim() && !details) {
    return NextResponse.json(
      { error: `Details sind ungültig (maximal ${REPORT_DETAILS_MAX_LENGTH} Zeichen)` },
      { status: 400 }
    );
  }

  const normalizedUrl = normalizeReportUrl(body.url);
  if (typeof body.url === "string" && body.url.trim() && !normalizedUrl) {
    return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
  }

  const providedDomain = normalizeDomain(body.domain);
  if (typeof body.domain === "string" && body.domain.trim() && !providedDomain) {
    return NextResponse.json({ error: "Ungültige Domain" }, { status: 400 });
  }

  const inferredDomain = normalizedUrl ? normalizeDomain(new URL(normalizedUrl).hostname) : null;
  const reportedDomain = providedDomain || inferredDomain || null;

  try {
    const admin = getSupabaseAdmin();

    const since = new Date(Date.now() - REPORT_RATE_LIMIT_HOURS * 60 * 60 * 1000).toISOString();
    const { data: existingReport, error: existingError } = await admin
      .from("moderation_reports")
      .select("id")
      .eq("reporter_user_id", user.id)
      .eq("resource_type", body.resourceType)
      .eq("resource_id", resourceId)
      .gte("created_at", since)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Report-Rate-Limit konnte nicht geprüft werden:", existingError);
      return NextResponse.json({ error: "Report konnte nicht gespeichert werden" }, { status: 500 });
    }

    if (existingReport?.id) {
      return NextResponse.json(
        { error: `Du kannst dieselbe Ressource nur einmal in ${REPORT_RATE_LIMIT_HOURS} Stunden melden.` },
        { status: 429 }
      );
    }

    const { data: inserted, error: insertError } = await admin
      .from("moderation_reports")
      .insert({
        reporter_user_id: user.id,
        resource_type: body.resourceType,
        resource_id: resourceId,
        reason_code: body.reasonCode,
        details,
        reported_domain: reportedDomain,
        reported_url: normalizedUrl,
      })
      .select("id, status, created_at")
      .single();

    if (insertError || !inserted) {
      console.error("Report konnte nicht gespeichert werden:", insertError);
      return NextResponse.json({ error: "Report konnte nicht gespeichert werden" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      reportId: inserted.id,
      status: inserted.status,
      createdAt: inserted.created_at,
    });
  } catch (error) {
    console.error("Report-API fehlgeschlagen:", error);
    return NextResponse.json({ error: "Report konnte nicht gespeichert werden" }, { status: 500 });
  }
}
