import type { SupabaseClient } from "@supabase/supabase-js";
import { domainMatchesPattern, normalizeDomain } from "@/lib/moderation";

export type BlockedDomainRule = {
  domain_pattern: string;
  block_scope: "share_only" | "all";
};

export type LinkDomainRow = {
  domain: string | null;
  url: string;
};

export function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return normalizeDomain(new URL(url).hostname);
  } catch {
    return null;
  }
}

export function extractNormalizedDomainsFromLinks(links: LinkDomainRow[]): string[] {
  const domains = new Set<string>();

  for (const link of links) {
    const normalized = normalizeDomain(link.domain) || domainFromUrl(link.url);
    if (normalized) domains.add(normalized);
  }

  return Array.from(domains);
}

export async function loadActiveBlockedDomainRules(
  admin: SupabaseClient
): Promise<BlockedDomainRule[]> {
  const { data, error } = await admin
    .from("blocked_domains")
    .select("domain_pattern, block_scope")
    .in("block_scope", ["share_only", "all"])
    .is("lifted_at", null);

  if (error) {
    throw new Error(`Blocklisten konnten nicht geladen werden (${error.code ?? "DB"})`);
  }

  return (data || []) as BlockedDomainRule[];
}

export function findMatchingBlockedDomain(
  domains: string[],
  rules: BlockedDomainRule[]
): string | null {
  for (const domain of domains) {
    for (const rule of rules) {
      if (domainMatchesPattern(domain, rule.domain_pattern)) {
        return rule.domain_pattern;
      }
    }
  }
  return null;
}
