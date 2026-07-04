import { NextResponse } from "next/server";
import { getAdminFromRequest, getSupabaseAdmin } from "@/lib/stripe";
import { isBlockScope, normalizeDomainPattern } from "@/lib/moderation";

type AdminActionBody = {
  action?: unknown;
  reportId?: unknown;
  note?: unknown;
  token?: unknown;
  reason?: unknown;
  domainPattern?: unknown;
  blockScope?: unknown;
  userId?: unknown;
  until?: unknown;
  targetType?: unknown;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHARE_TOKEN_RE = /^[A-Za-z0-9_-]{12,256}$/;
const REPORT_NOTE_MAX_LENGTH = 1000;

type ValidAction =
  | "dismiss_report"
  | "revoke_share"
  | "block_domain"
  | "disable_user_sharing"
  | "suspend_user"
  | "reinstate_content";

function isValidAction(value: unknown): value is ValidAction {
  return (
    value === "dismiss_report" ||
    value === "revoke_share" ||
    value === "block_domain" ||
    value === "disable_user_sharing" ||
    value === "suspend_user" ||
    value === "reinstate_content"
  );
}

function parseOptionalReportId(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(num) || num <= 0) return null;
  return num;
}

function normalizeNote(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, REPORT_NOTE_MAX_LENGTH);
}

function normalizeUuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!UUID_RE.test(trimmed)) return null;
  return trimmed;
}

function normalizeShareToken(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!SHARE_TOKEN_RE.test(trimmed)) return null;
  return trimmed;
}

function normalizeFutureTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date <= new Date()) return null;
  return date.toISOString();
}

async function ensureReportExists(
  admin: ReturnType<typeof getSupabaseAdmin>,
  reportId: number | null
): Promise<NextResponse | null> {
  if (!reportId) return null;
  const { data, error } = await admin.from("moderation_reports").select("id").eq("id", reportId).maybeSingle();
  if (error) {
    console.error("Report-Prüfung fehlgeschlagen:", error);
    return NextResponse.json({ error: "Report konnte nicht geprüft werden" }, { status: 500 });
  }
  if (!data?.id) {
    return NextResponse.json({ error: "Report nicht gefunden" }, { status: 404 });
  }
  return null;
}

async function markReportReviewed(params: {
  admin: ReturnType<typeof getSupabaseAdmin>;
  reportId: number | null;
  status: "dismissed" | "actioned";
  adminId: string;
  note: string | null;
}) {
  const { admin, reportId, status, adminId, note } = params;
  if (!reportId) return;

  const update: {
    status: "dismissed" | "actioned";
    reviewed_by_admin_id: string;
    reviewed_at: string;
    action_note?: string;
  } = {
    status,
    reviewed_by_admin_id: adminId,
    reviewed_at: new Date().toISOString(),
  };
  if (note) update.action_note = note;

  const { error } = await admin.from("moderation_reports").update(update).eq("id", reportId);
  if (error) {
    throw new Error(`Report-Status konnte nicht aktualisiert werden (${error.code ?? "DB"})`);
  }
}

async function insertModerationEvent(
  admin: ReturnType<typeof getSupabaseAdmin>,
  event: {
    event_type:
      | "share_revoked"
      | "user_sharing_disabled"
      | "user_suspended"
      | "domain_blocked"
      | "report_dismissed"
      | "content_reinstated";
    actor_admin_id: string;
    report_id?: number | null;
    target_user_id?: string | null;
    share_token?: string | null;
    domain_pattern?: string | null;
    block_scope?: "share_only" | "all" | null;
    payload?: Record<string, unknown>;
  }
) {
  const { error } = await admin.from("moderation_events").insert({
    event_type: event.event_type,
    actor_admin_id: event.actor_admin_id,
    report_id: event.report_id ?? null,
    target_user_id: event.target_user_id ?? null,
    share_token: event.share_token ?? null,
    domain_pattern: event.domain_pattern ?? null,
    block_scope: event.block_scope ?? null,
    payload: event.payload ?? {},
  });

  if (error) {
    throw new Error(`Audit-Event konnte nicht gespeichert werden (${error.code ?? "DB"})`);
  }
}

export async function POST(request: Request) {
  const adminUser = await getAdminFromRequest(request);
  if (!adminUser) {
    return NextResponse.json({ error: "Keine Admin-Berechtigung" }, { status: 403 });
  }

  let body: AdminActionBody;
  try {
    body = (await request.json()) as AdminActionBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  if (!isValidAction(body.action)) {
    return NextResponse.json({ error: "Unbekannte Admin-Aktion" }, { status: 400 });
  }

  const reportId = parseOptionalReportId(body.reportId);
  if (body.reportId !== undefined && body.reportId !== null && body.reportId !== "" && !reportId) {
    return NextResponse.json({ error: "Ungültige Report-ID" }, { status: 400 });
  }

  const note = normalizeNote(body.note);

  try {
    const admin = getSupabaseAdmin();
    const reportCheck = await ensureReportExists(admin, reportId);
    if (reportCheck) return reportCheck;

    if (body.action === "dismiss_report") {
      if (!reportId) {
        return NextResponse.json({ error: "reportId ist für dismiss_report erforderlich" }, { status: 400 });
      }

      await markReportReviewed({
        admin,
        reportId,
        status: "dismissed",
        adminId: adminUser.id,
        note,
      });

      await insertModerationEvent(admin, {
        event_type: "report_dismissed",
        actor_admin_id: adminUser.id,
        report_id: reportId,
        payload: note ? { note } : {},
      });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "revoke_share") {
      const token = normalizeShareToken(body.token);
      if (!token) {
        return NextResponse.json({ error: "Ungültiger Share-Token" }, { status: 400 });
      }
      const reason = normalizeNote(body.reason) || note || "revoked_by_admin";
      const nowIso = new Date().toISOString();

      const { data: share, error: revokeError } = await admin
        .from("share_tokens")
        .update({
          revoked: true,
          revoked_reason: reason,
          revoked_at: nowIso,
          revoked_by_admin_id: adminUser.id,
        })
        .eq("token", token)
        .select("token")
        .maybeSingle();

      if (revokeError) {
        console.error("Share-Widerruf fehlgeschlagen:", revokeError);
        return NextResponse.json({ error: "Share konnte nicht widerrufen werden" }, { status: 500 });
      }
      if (!share?.token) {
        return NextResponse.json({ error: "Share-Token nicht gefunden" }, { status: 404 });
      }

      await markReportReviewed({
        admin,
        reportId,
        status: "actioned",
        adminId: adminUser.id,
        note,
      });

      await insertModerationEvent(admin, {
        event_type: "share_revoked",
        actor_admin_id: adminUser.id,
        report_id: reportId,
        share_token: token,
        payload: { reason },
      });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "block_domain") {
      const domainPattern = normalizeDomainPattern(body.domainPattern);
      if (!domainPattern) {
        return NextResponse.json({ error: "Ungültiges Domain-Pattern" }, { status: 400 });
      }

      const blockScope = isBlockScope(body.blockScope) ? body.blockScope : "share_only";
      const reason = normalizeNote(body.reason) || note;

      const { error: blockError } = await admin.from("blocked_domains").upsert(
        {
          domain_pattern: domainPattern,
          block_scope: blockScope,
          reason: reason || null,
          blocked_by_admin_id: adminUser.id,
          lifted_at: null,
          lifted_by_admin_id: null,
        },
        { onConflict: "domain_pattern" }
      );

      if (blockError) {
        console.error("Domain-Block fehlgeschlagen:", blockError);
        return NextResponse.json({ error: "Domain konnte nicht blockiert werden" }, { status: 500 });
      }

      await markReportReviewed({
        admin,
        reportId,
        status: "actioned",
        adminId: adminUser.id,
        note,
      });

      await insertModerationEvent(admin, {
        event_type: "domain_blocked",
        actor_admin_id: adminUser.id,
        report_id: reportId,
        domain_pattern: domainPattern,
        block_scope: blockScope,
        payload: reason ? { reason } : {},
      });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "disable_user_sharing") {
      const userId = normalizeUuid(body.userId);
      if (!userId) {
        return NextResponse.json({ error: "Ungültige userId" }, { status: 400 });
      }
      const until = normalizeFutureTimestamp(body.until);
      if (!until) {
        return NextResponse.json({ error: "Ungültiges 'until' (muss in der Zukunft liegen)" }, { status: 400 });
      }

      const { error: disableError } = await admin
        .from("profiles")
        .upsert({ id: userId, sharing_disabled_until: until }, { onConflict: "id" });
      if (disableError) {
        console.error("Sharing-Sperre fehlgeschlagen:", disableError);
        return NextResponse.json({ error: "Nutzer-Sharing konnte nicht gesperrt werden" }, { status: 500 });
      }

      await markReportReviewed({
        admin,
        reportId,
        status: "actioned",
        adminId: adminUser.id,
        note,
      });

      await insertModerationEvent(admin, {
        event_type: "user_sharing_disabled",
        actor_admin_id: adminUser.id,
        report_id: reportId,
        target_user_id: userId,
        payload: { until },
      });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "suspend_user") {
      const userId = normalizeUuid(body.userId);
      if (!userId) {
        return NextResponse.json({ error: "Ungültige userId" }, { status: 400 });
      }
      const until = normalizeFutureTimestamp(body.until);
      if (!until) {
        return NextResponse.json({ error: "Ungültiges 'until' (muss in der Zukunft liegen)" }, { status: 400 });
      }

      const { error: suspendError } = await admin
        .from("profiles")
        .upsert(
          {
            id: userId,
            suspended_until: until,
            sharing_disabled_until: until,
            account_status: "suspended",
          },
          { onConflict: "id" }
        );
      if (suspendError) {
        console.error("Nutzer-Suspendierung fehlgeschlagen:", suspendError);
        return NextResponse.json({ error: "Nutzer konnte nicht suspendiert werden" }, { status: 500 });
      }

      await markReportReviewed({
        admin,
        reportId,
        status: "actioned",
        adminId: adminUser.id,
        note,
      });

      await insertModerationEvent(admin, {
        event_type: "user_suspended",
        actor_admin_id: adminUser.id,
        report_id: reportId,
        target_user_id: userId,
        payload: { until },
      });

      return NextResponse.json({ ok: true });
    }

    if (body.action === "reinstate_content") {
      const targetType = body.targetType;
      if (targetType !== "share_token" && targetType !== "domain" && targetType !== "user") {
        return NextResponse.json(
          { error: "Ungültiger targetType (erlaubt: share_token, domain, user)" },
          { status: 400 }
        );
      }

      if (targetType === "share_token") {
        const token = normalizeShareToken(body.token);
        if (!token) {
          return NextResponse.json({ error: "Ungültiger Share-Token" }, { status: 400 });
        }

        const { data, error } = await admin
          .from("share_tokens")
          .update({
            revoked: false,
            revoked_reason: null,
            revoked_at: null,
            revoked_by_admin_id: null,
          })
          .eq("token", token)
          .select("token")
          .maybeSingle();
        if (error) {
          console.error("Share-Freigabe fehlgeschlagen:", error);
          return NextResponse.json({ error: "Share konnte nicht freigegeben werden" }, { status: 500 });
        }
        if (!data?.token) {
          return NextResponse.json({ error: "Share-Token nicht gefunden" }, { status: 404 });
        }

        await markReportReviewed({
          admin,
          reportId,
          status: "actioned",
          adminId: adminUser.id,
          note,
        });

        await insertModerationEvent(admin, {
          event_type: "content_reinstated",
          actor_admin_id: adminUser.id,
          report_id: reportId,
          share_token: token,
          payload: { targetType },
        });

        return NextResponse.json({ ok: true });
      }

      if (targetType === "domain") {
        const domainPattern = normalizeDomainPattern(body.domainPattern);
        if (!domainPattern) {
          return NextResponse.json({ error: "Ungültiges Domain-Pattern" }, { status: 400 });
        }

        const nowIso = new Date().toISOString();
        const { data, error } = await admin
          .from("blocked_domains")
          .update({ lifted_at: nowIso, lifted_by_admin_id: adminUser.id })
          .eq("domain_pattern", domainPattern)
          .is("lifted_at", null)
          .select("id")
          .maybeSingle();
        if (error) {
          console.error("Domain-Freigabe fehlgeschlagen:", error);
          return NextResponse.json({ error: "Domain konnte nicht freigegeben werden" }, { status: 500 });
        }
        if (!data?.id) {
          return NextResponse.json({ error: "Aktive Domain-Sperre nicht gefunden" }, { status: 404 });
        }

        await markReportReviewed({
          admin,
          reportId,
          status: "actioned",
          adminId: adminUser.id,
          note,
        });

        await insertModerationEvent(admin, {
          event_type: "content_reinstated",
          actor_admin_id: adminUser.id,
          report_id: reportId,
          domain_pattern: domainPattern,
          payload: { targetType },
        });

        return NextResponse.json({ ok: true });
      }

      const userId = normalizeUuid(body.userId);
      if (!userId) {
        return NextResponse.json({ error: "Ungültige userId" }, { status: 400 });
      }

      const { data, error } = await admin
        .from("profiles")
        .update({
          sharing_disabled_until: null,
          suspended_until: null,
          account_status: "active",
        })
        .eq("id", userId)
        .select("id")
        .maybeSingle();
      if (error) {
        console.error("Nutzer-Freigabe fehlgeschlagen:", error);
        return NextResponse.json({ error: "Nutzer konnte nicht freigegeben werden" }, { status: 500 });
      }
      if (!data?.id) {
        return NextResponse.json({ error: "Nutzerprofil nicht gefunden" }, { status: 404 });
      }

      await markReportReviewed({
        admin,
        reportId,
        status: "actioned",
        adminId: adminUser.id,
        note,
      });

      await insertModerationEvent(admin, {
        event_type: "content_reinstated",
        actor_admin_id: adminUser.id,
        report_id: reportId,
        target_user_id: userId,
        payload: { targetType },
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
  } catch (error) {
    console.error("Moderation-Admin-Aktion fehlgeschlagen:", error);
    return NextResponse.json({ error: "Admin-Aktion fehlgeschlagen" }, { status: 500 });
  }
}
