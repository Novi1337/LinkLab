import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { getSupabaseAdmin, getUserFromRequest } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rateLimit";

type IdentityBody = {
  nickname?: string;
  handle?: string;
};

const MAX_NICKNAME_LENGTH = 32;
const MIN_HANDLE_LENGTH = 3;
const MAX_HANDLE_LENGTH = 24;
const HANDLE_COOLDOWN_DAYS = 30;

const RESERVED_HANDLE_PATTERNS: RegExp[] = [
  /admin/,
  /administrator/,
  /official/,
  /support/,
  /helpdesk/,
  /customer/,
  /service/,
  /team/,
  /staff/,
  /moderator/,
  /mod/,
  /security/,
  /trust/,
  /safety/,
  /system/,
  /root/,
  /owner/,
  /linklab/,
];

function mapNicknameDbError(
  error: { code?: string; message?: string } | null | undefined,
  context: "load" | "save"
): string {
  if (error?.code === "42703") {
    return "DB-Spalte fehlt: Bitte in Supabase sharing.sql und profiles.sql ausführen.";
  }
  if (error?.code === "23505") {
    return "Dieser Handle ist bereits vergeben.";
  }
  return context === "load"
    ? "Nickname konnte nicht geladen werden"
    : "Sharing-Identität konnte nicht gespeichert werden";
}

function normalizeNickname(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const collapsed = input.replace(/\s+/g, " ").trim();
  if (!collapsed) return null;
  if (collapsed.length > MAX_NICKNAME_LENGTH) return null;
  return collapsed;
}

function normalizeHandle(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const cleaned = input
    .toLowerCase()
    .trim()
    .replace(/^@+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleaned) return null;
  if (cleaned.length < MIN_HANDLE_LENGTH || cleaned.length > MAX_HANDLE_LENGTH) return null;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned)) return null;
  return cleaned;
}

function normalizeForSafetyChecks(handle: string): string {
  const map: Record<string, string> = {
    "0": "o",
    "1": "l",
    "3": "e",
    "4": "a",
    "5": "s",
    "7": "t",
    "8": "b",
    "9": "g",
    "@": "a",
    "$": "s",
  };

  return handle
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] || ch)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

function isReservedHandle(handle: string): boolean {
  const normalized = normalizeForSafetyChecks(handle);
  return RESERVED_HANDLE_PATTERNS.some((pattern) => pattern.test(normalized));
}

function nextAllowedHandleChange(handleChangedAt?: string | null): string | null {
  if (!handleChangedAt) return null;
  const changedAt = new Date(handleChangedAt);
  const next = new Date(changedAt.getTime() + HANDLE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  return next.toISOString();
}

function canChangeHandleNow(handleChangedAt?: string | null): boolean {
  const next = nextAllowedHandleChange(handleChangedAt);
  if (!next) return true;
  return new Date(next) <= new Date();
}

function buildHandleBase(seed: string): string {
  const base = seed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 16);
  return base.length >= MIN_HANDLE_LENGTH ? base : "user";
}

async function generateUniqueHandle(admin: ReturnType<typeof getSupabaseAdmin>, seed: string): Promise<string> {
  const base = buildHandleBase(seed);
  for (let i = 0; i < 15; i++) {
    const suffix = randomBytes(2).toString("hex");
    const candidate = `${base}-${suffix}`;
    const { data: conflict } = await admin
      .from("profiles")
      .select("id")
      .eq("share_handle", candidate)
      .maybeSingle();
    if (!conflict && !isReservedHandle(candidate)) return candidate;
  }
  throw new Error("Kein eindeutiger Handle verfügbar");
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
      .select("share_nickname, share_handle, share_handle_changed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Nickname konnte nicht geladen werden:", error);
      return NextResponse.json({ error: mapNicknameDbError(error, "load") }, { status: 500 });
    }

    let handle = data?.share_handle?.trim() || null;
    if (!handle) {
      const seed = user.email?.split("@")[0] || data?.share_nickname || "user";
      handle = await generateUniqueHandle(admin, seed);
      const { error: handleSaveError } = await admin
        .from("profiles")
        .upsert({ id: user.id, share_handle: handle }, { onConflict: "id" });
      if (handleSaveError) {
        console.error("Auto-Handle konnte nicht gespeichert werden:", handleSaveError);
        return NextResponse.json({ error: mapNicknameDbError(handleSaveError, "load") }, { status: 500 });
      }
    }

    const canChangeHandleAt = nextAllowedHandleChange(data?.share_handle_changed_at || null);

    return NextResponse.json({
      nickname: data?.share_nickname ?? null,
      handle,
      email: user.email || null,
      canChangeHandleAt,
      handleCooldownDays: HANDLE_COOLDOWN_DAYS,
    });
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

  // Rate-Limit: Der Handle hat bereits einen 30-Tage-Cooldown, aber der Nickname
  // war unbegrenzt änderbar - das bremst Spam-/Lastspitzen einzelner Accounts.
  if (!checkRateLimit(`nickname:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: "Zu viele Änderungen. Bitte kurz warten." }, { status: 429 });
  }

  let body: IdentityBody;
  try {
    body = (await request.json()) as IdentityBody;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body" }, { status: 400 });
  }

  const rawNickname = body.nickname;
  const normalizedNickname = normalizeNickname(rawNickname);
  if (typeof rawNickname === "string" && rawNickname.trim() && !normalizedNickname) {
    return NextResponse.json(
      { error: `Nickname ist ungültig (maximal ${MAX_NICKNAME_LENGTH} Zeichen)` },
      { status: 400 }
    );
  }

  const rawHandle = body.handle;
  const normalizedHandle = normalizeHandle(rawHandle);
  if (!normalizedHandle) {
    return NextResponse.json(
      { error: `Handle ist ungültig (nur a-z, 0-9, Bindestrich; ${MIN_HANDLE_LENGTH}-${MAX_HANDLE_LENGTH} Zeichen)` },
      { status: 400 }
    );
  }
  if (isReservedHandle(normalizedHandle)) {
    return NextResponse.json(
      { error: "Dieser Handle ist reserviert oder zu nah an internen Rollenbegriffen." },
      { status: 400 }
    );
  }

  try {
    const admin = getSupabaseAdmin();

    const { data: currentProfile, error: profileError } = await admin
      .from("profiles")
      .select("share_handle, share_handle_changed_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: mapNicknameDbError(profileError, "save") }, { status: 500 });
    }

    const currentHandle = currentProfile?.share_handle || null;
    const handleChanged = !!currentHandle && currentHandle !== normalizedHandle;

    if (handleChanged && !canChangeHandleNow(currentProfile?.share_handle_changed_at)) {
      const next = nextAllowedHandleChange(currentProfile?.share_handle_changed_at);
      return NextResponse.json(
        {
          error: `Handle kann nur alle ${HANDLE_COOLDOWN_DAYS} Tage geändert werden. Nächste Änderung möglich ab ${new Date(next || "").toLocaleDateString("de-DE")}.`,
        },
        { status: 429 }
      );
    }

    const { data: conflict } = await admin
      .from("profiles")
      .select("id")
      .eq("share_handle", normalizedHandle)
      .neq("id", user.id)
      .maybeSingle();

    if (conflict?.id) {
      return NextResponse.json({ error: "Dieser Handle ist bereits vergeben." }, { status: 409 });
    }

    const handleChangedAt = handleChanged || !currentHandle ? new Date().toISOString() : currentProfile?.share_handle_changed_at || null;

    const { data, error } = await admin
      .from("profiles")
      .upsert(
        {
          id: user.id,
          share_nickname: normalizedNickname,
          share_handle: normalizedHandle,
          share_handle_changed_at: handleChangedAt,
        },
        { onConflict: "id" }
      )
      .select("share_nickname, share_handle, share_handle_changed_at")
      .single();

    if (error) {
      console.error("Nickname konnte nicht gespeichert werden:", error);
      return NextResponse.json({ error: mapNicknameDbError(error, "save") }, { status: 500 });
    }

    return NextResponse.json({
      nickname: data?.share_nickname ?? null,
      handle: data?.share_handle ?? null,
      email: user.email || null,
      canChangeHandleAt: nextAllowedHandleChange(data?.share_handle_changed_at || null),
      handleCooldownDays: HANDLE_COOLDOWN_DAYS,
    });
  } catch (err) {
    console.error("Nickname-POST fehlgeschlagen:", err);
    return NextResponse.json({ error: "Sharing-Identität konnte nicht gespeichert werden" }, { status: 500 });
  }
}
