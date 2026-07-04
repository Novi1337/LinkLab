export const MODERATION_REASON_CODES = [
  "csam",
  "animal_abuse",
  "non_consensual_intimate",
  "human_trafficking",
  "malware_phishing",
  "scam",
  "terror_extremism_illegal",
  "threats_doxxing",
  "serious_crime_market_or_instruction",
  "other_illegal",
] as const;

export type ModerationReasonCode = (typeof MODERATION_REASON_CODES)[number];

export const MODERATION_RESOURCE_TYPES = ["tab", "section", "link", "share_token"] as const;
export type ModerationResourceType = (typeof MODERATION_RESOURCE_TYPES)[number];

export const MODERATION_REPORT_STATUSES = ["open", "in_review", "actioned", "dismissed"] as const;
export type ModerationReportStatus = (typeof MODERATION_REPORT_STATUSES)[number];

export const MODERATION_EVENT_TYPES = [
  "share_revoked",
  "user_sharing_disabled",
  "user_suspended",
  "domain_blocked",
  "report_dismissed",
  "content_reinstated",
] as const;
export type ModerationEventType = (typeof MODERATION_EVENT_TYPES)[number];

export const BLOCK_SCOPES = ["share_only", "all"] as const;
export type BlockScope = (typeof BLOCK_SCOPES)[number];

export function isModerationReasonCode(value: unknown): value is ModerationReasonCode {
  return typeof value === "string" && MODERATION_REASON_CODES.includes(value as ModerationReasonCode);
}

export function isModerationResourceType(value: unknown): value is ModerationResourceType {
  return typeof value === "string" && MODERATION_RESOURCE_TYPES.includes(value as ModerationResourceType);
}

export function isModerationReportStatus(value: unknown): value is ModerationReportStatus {
  return typeof value === "string" && MODERATION_REPORT_STATUSES.includes(value as ModerationReportStatus);
}

export function isBlockScope(value: unknown): value is BlockScope {
  return typeof value === "string" && BLOCK_SCOPES.includes(value as BlockScope);
}

export function isTimestampActive(value: string | null | undefined): boolean {
  if (!value) return false;
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return false;
  return timestamp > new Date();
}

function extractHost(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return "";
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return trimmed
      .split("/")[0]
      .split("?")[0]
      .split("#")[0]
      .split(":")[0]
      .toLowerCase();
  }
}

export function normalizeDomain(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const host = extractHost(input)
    .replace(/^\.+|\.+$/g, "")
    .replace(/^www\./, "");

  if (!host) return null;
  if (!/^[a-z0-9.-]+$/.test(host)) return null;
  if (host.startsWith("-") || host.endsWith("-")) return null;
  return host;
}

export function normalizeDomainPattern(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  if (trimmed.startsWith("*.")) {
    const suffix = normalizeDomain(trimmed.slice(2));
    return suffix ? `*.${suffix}` : null;
  }

  return normalizeDomain(trimmed);
}

export function domainMatchesPattern(domain: string, pattern: string): boolean {
  const normalizedDomain = normalizeDomain(domain);
  const normalizedPattern = normalizeDomainPattern(pattern);
  if (!normalizedDomain || !normalizedPattern) return false;

  if (normalizedPattern.startsWith("*.")) {
    const suffix = normalizedPattern.slice(2);
    return normalizedDomain === suffix || normalizedDomain.endsWith(`.${suffix}`);
  }

  return normalizedDomain === normalizedPattern;
}

export function collectNormalizedDomains(values: Array<string | null | undefined>): string[] {
  const set = new Set<string>();
  for (const value of values) {
    const normalized = normalizeDomain(value ?? "");
    if (normalized) set.add(normalized);
  }
  return Array.from(set);
}
