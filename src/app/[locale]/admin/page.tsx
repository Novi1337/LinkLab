"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { localeFromPathname, type AppLocale } from "@/lib/locale";

type ReportRow = {
  id: number;
  reporter_user_id: string;
  resource_type: "tab" | "section" | "link" | "share_token";
  resource_id: string;
  reason_code: string;
  details: string | null;
  reported_domain: string | null;
  reported_url: string | null;
  status: string;
  created_at: string;
};

type RevokedShareRow = {
  token: string;
  owner_user_id: string;
  revoked_reason: string | null;
  revoked_at: string | null;
};

type RestrictedUserRow = {
  id: string;
  sharing_disabled_until: string | null;
  suspended_until: string | null;
  account_status: string | null;
};

type BlockedDomainRow = {
  id: number;
  domain_pattern: string;
  block_scope: "share_only" | "all";
  reason: string | null;
  created_at: string;
};

type TopDomainRow = {
  domain: string;
  count: number;
};

type AdminDirectoryRow = {
  userId: string;
  nickname: string | null;
  email: string | null;
  tag: string | null;
  country: string | null;
  linksGathered: number;
  timeOfRegistry: string | null;
  lastLogin: string | null;
  ipAddress: string | null;
};

type DashboardResponse = {
  reports: ReportRow[];
  recentRevokedShares: RevokedShareRow[];
  restrictedUsers: RestrictedUserRow[];
  blockedDomains: BlockedDomainRow[];
  topDomains: TopDomainRow[];
  adminDirectory: AdminDirectoryRow[];
};

type AdminActionPayload = Record<string, unknown>;

type BlockScope = "share_only" | "all";

function formatDate(value: string | null, locale: AppLocale): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(locale === "en" ? "en-US" : "de-DE");
}

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultUserUntilValue(): string {
  const inSevenDays = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return toDateTimeLocalValue(inSevenDays);
}

export default function AdminPage() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname) as AppLocale;
  const isEn = locale === "en";

  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);

  const [domainPatternInput, setDomainPatternInput] = useState("");
  const [domainScopeInput, setDomainScopeInput] = useState<BlockScope>("share_only");
  const [domainReasonInput, setDomainReasonInput] = useState("");

  const [userIdInput, setUserIdInput] = useState("");
  const [userUntilInput, setUserUntilInput] = useState(defaultUserUntilValue());
  const [userReasonInput, setUserReasonInput] = useState("");
  const [directorySearch, setDirectorySearch] = useState("");

  const getAccessToken = useCallback(async (): Promise<string> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      throw new Error(isEn ? "Please log in as admin." : "Bitte als Admin einloggen.");
    }
    return accessToken;
  }, [isEn]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const accessToken = await getAccessToken();
      const res = await fetch("/api/moderation/admin/reports?includeDashboard=1", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          payload?.error ||
            (isEn ? "Could not load moderation dashboard." : "Moderations-Dashboard konnte nicht geladen werden.")
        );
      }

      setData(payload as DashboardResponse);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : (isEn ? "Could not load moderation dashboard." : "Moderations-Dashboard konnte nicht geladen werden.")
      );
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, isEn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDashboard]);

  const runAdminAction = useCallback(
    async (payload: AdminActionPayload, busyKey: string) => {
      setBusyAction(busyKey);
      setError(null);
      setNotice(null);

      try {
        const accessToken = await getAccessToken();
        const res = await fetch("/api/moderation/admin/action", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
          body: JSON.stringify(payload),
        });
        const response = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(response?.error || (isEn ? "Action failed." : "Aktion fehlgeschlagen."));
        }
        await loadDashboard();
        setNotice(isEn ? "Action completed." : "Aktion durchgeführt.");
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : (isEn ? "Action failed." : "Aktion fehlgeschlagen."));
        return false;
      } finally {
        setBusyAction(null);
      }
    },
    [getAccessToken, isEn, loadDashboard]
  );

  const dismissReport = (reportId: number) =>
    runAdminAction({ action: "dismiss_report", reportId }, `report:${reportId}:dismiss`);

  const revokeShareFromReport = (report: ReportRow) =>
    runAdminAction(
      {
        action: "revoke_share",
        reportId: report.id,
        token: report.resource_id,
        reason: `report:${report.reason_code}`,
      },
      `report:${report.id}:revoke`
    );

  const blockDomainFromReport = (report: ReportRow) =>
    runAdminAction(
      {
        action: "block_domain",
        reportId: report.id,
        domainPattern: report.reported_domain,
        blockScope: "share_only",
        reason: `report:${report.reason_code}`,
      },
      `report:${report.id}:block-domain`
    );

  const reinstateShareToken = (token: string) =>
    runAdminAction(
      {
        action: "reinstate_content",
        targetType: "share_token",
        token,
      },
      `reinstate:share:${token}`
    );

  const reinstateDomain = (domainPattern: string) =>
    runAdminAction(
      {
        action: "reinstate_content",
        targetType: "domain",
        domainPattern,
      },
      `reinstate:domain:${domainPattern}`
    );

  const reinstateUser = (userId: string) =>
    runAdminAction(
      {
        action: "reinstate_content",
        targetType: "user",
        userId,
      },
      `reinstate:user:${userId}`
    );

  const submitBlockDomain = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const domainPattern = domainPatternInput.trim();
    if (!domainPattern) {
      setError(isEn ? "Please enter a domain pattern." : "Bitte ein Domain-Pattern eingeben.");
      return;
    }

    const ok = await runAdminAction(
      {
        action: "block_domain",
        domainPattern,
        blockScope: domainScopeInput,
        reason: domainReasonInput.trim() || undefined,
      },
      "form:block-domain"
    );
    if (ok) {
      setDomainPatternInput("");
      setDomainReasonInput("");
      setDomainScopeInput("share_only");
    }
  };

  const runUserRestriction = async (action: "disable_user_sharing" | "suspend_user") => {
    const userId = userIdInput.trim();
    if (!userId) {
      setError(isEn ? "Please enter a user ID." : "Bitte eine User-ID eingeben.");
      return;
    }

    if (!userUntilInput.trim()) {
      setError(isEn ? "Please enter an end date/time." : "Bitte ein Enddatum/-zeit eingeben.");
      return;
    }

    const untilDate = new Date(userUntilInput);
    if (Number.isNaN(untilDate.getTime()) || untilDate <= new Date()) {
      setError(
        isEn
          ? "End date/time must be valid and in the future."
          : "Enddatum/-zeit muss gültig sein und in der Zukunft liegen."
      );
      return;
    }

    const ok = await runAdminAction(
      {
        action,
        userId,
        until: untilDate.toISOString(),
        reason: userReasonInput.trim() || undefined,
      },
      `form:${action}`
    );

    if (ok) {
      setUserReasonInput("");
      setUserUntilInput(defaultUserUntilValue());
    }
  };

  const filteredAdminDirectory = (data?.adminDirectory || []).filter((row) => {
    const query = directorySearch.trim().toLowerCase();
    if (!query) return true;

    const haystack = [
      row.nickname,
      row.email,
      row.tag,
      row.country,
      row.ipAddress,
      row.userId,
      String(row.linksGathered),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  return (
    <main className="max-w-shell mx-auto px-5 py-8 flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-brand-dark m-0">
          {isEn ? "Moderation Admin" : "Moderation Admin"}
        </h1>
        <p className="text-sm text-slate-500 m-0">
          {isEn
            ? "Report-driven abuse handling with reversible actions."
            : "Report-getriebene Abuse-Bearbeitung mit reversiblen Maßnahmen."}
        </p>
      </header>

      {loading && <p className="text-sm text-slate-500 m-0">{isEn ? "Loading ..." : "Lade ..."}</p>}
      {error && <p className="text-sm text-danger m-0">{error}</p>}
      {notice && <p className="text-sm text-emerald-700 m-0">{notice}</p>}

      {!loading && data && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mt-0 mb-3">
              {isEn ? "Admin actions" : "Admin-Aktionen"}
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <form onSubmit={submitBlockDomain} className="rounded-xl border border-slate-100 p-3 flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 m-0">
                  {isEn ? "Block domain/pattern" : "Domain/Pattern blockieren"}
                </h3>
                <input
                  type="text"
                  value={domainPatternInput}
                  onChange={(e) => setDomainPatternInput(e.target.value)}
                  placeholder={isEn ? "example.com or *.example.com" : "beispiel.de oder *.beispiel.de"}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
                <select
                  value={domainScopeInput}
                  onChange={(e) => setDomainScopeInput(e.target.value as BlockScope)}
                  className="p-2 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="share_only">share_only</option>
                  <option value="all">all</option>
                </select>
                <input
                  type="text"
                  value={domainReasonInput}
                  onChange={(e) => setDomainReasonInput(e.target.value)}
                  placeholder={isEn ? "Reason (optional)" : "Grund (optional)"}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  type="submit"
                  disabled={busyAction === "form:block-domain"}
                  className="self-start px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {busyAction === "form:block-domain"
                    ? (isEn ? "Saving ..." : "Speichere ...")
                    : (isEn ? "Block domain" : "Domain blockieren")}
                </button>
              </form>

              <div className="rounded-xl border border-slate-100 p-3 flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600 m-0">
                  {isEn ? "Restrict user" : "Nutzer einschränken"}
                </h3>
                <input
                  type="text"
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder={isEn ? "User UUID" : "User-UUID"}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  type="datetime-local"
                  value={userUntilInput}
                  onChange={(e) => setUserUntilInput(e.target.value)}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  type="text"
                  value={userReasonInput}
                  onChange={(e) => setUserReasonInput(e.target.value)}
                  placeholder={isEn ? "Reason (optional)" : "Grund (optional)"}
                  className="p-2 rounded-lg border border-slate-300 text-sm"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => runUserRestriction("disable_user_sharing")}
                    disabled={busyAction === "form:disable_user_sharing"}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    {busyAction === "form:disable_user_sharing"
                      ? (isEn ? "Saving ..." : "Speichere ...")
                      : (isEn ? "Disable sharing" : "Sharing sperren")}
                  </button>
                  <button
                    type="button"
                    onClick={() => runUserRestriction("suspend_user")}
                    disabled={busyAction === "form:suspend_user"}
                    className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {busyAction === "form:suspend_user"
                      ? (isEn ? "Saving ..." : "Speichere ...")
                      : (isEn ? "Suspend user" : "Nutzer suspendieren")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 m-0">
                {isEn ? "Registered users" : "Registrierte Nutzer"}
              </h2>
              <input
                type="text"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                placeholder={
                  isEn
                    ? "Search: nickname, email, tag, country, IP, user ID"
                    : "Suche: Nickname, E-Mail, Tag, Land, IP, User-ID"
                }
                className="w-full md:w-96 p-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            {filteredAdminDirectory.length === 0 ? (
              <p className="text-sm text-slate-500 m-0">{isEn ? "No users found." : "Keine Nutzer gefunden."}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 pr-3">{isEn ? "Nickname" : "Nickname"}</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Tag</th>
                      <th className="py-2 pr-3">{isEn ? "Country" : "Land"}</th>
                      <th className="py-2 pr-3">{isEn ? "Links gathered" : "Gesammelte Links"}</th>
                      <th className="py-2 pr-3">{isEn ? "Time of registry" : "Registriert am"}</th>
                      <th className="py-2 pr-3">{isEn ? "Last login" : "Letzter Login"}</th>
                      <th className="py-2 pr-3">{isEn ? "IP address" : "IP-Adresse"}</th>
                      <th className="py-2">User ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminDirectory.map((row) => (
                      <tr key={row.userId} className="border-t border-slate-100 align-top">
                        <td className="py-2 pr-3">{row.nickname || "-"}</td>
                        <td className="py-2 pr-3 break-all">{row.email || "-"}</td>
                        <td className="py-2 pr-3">{row.tag || "-"}</td>
                        <td className="py-2 pr-3">{row.country || "-"}</td>
                        <td className="py-2 pr-3 font-semibold">{row.linksGathered}</td>
                        <td className="py-2 pr-3 text-xs text-slate-500">{formatDate(row.timeOfRegistry, locale)}</td>
                        <td className="py-2 pr-3 text-xs text-slate-500">{formatDate(row.lastLogin, locale)}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{row.ipAddress || "-"}</td>
                        <td className="py-2 font-mono text-xs break-all">{row.userId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mt-0 mb-3">
              {isEn ? "Open reports" : "Offene Meldungen"}
            </h2>
            {data.reports.length === 0 ? (
              <p className="text-sm text-slate-500 m-0">{isEn ? "No open reports." : "Keine offenen Meldungen."}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">{isEn ? "Type" : "Typ"}</th>
                      <th className="py-2 pr-3">{isEn ? "Reason" : "Grund"}</th>
                      <th className="py-2 pr-3">{isEn ? "Created" : "Erstellt"}</th>
                      <th className="py-2">{isEn ? "Actions" : "Aktionen"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.reports.map((report) => (
                      <tr key={report.id} className="border-t border-slate-100 align-top">
                        <td className="py-2 pr-3 font-mono">{report.id}</td>
                        <td className="py-2 pr-3">
                          <div className="font-semibold text-brand-dark">{report.resource_type}</div>
                          <div className="text-xs text-slate-500 break-all">{report.resource_id}</div>
                          <div className="text-xs text-slate-400 break-all">reporter: {report.reporter_user_id}</div>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium">{report.reason_code}</div>
                          {report.reported_domain && (
                            <div className="text-xs text-slate-500">domain: {report.reported_domain}</div>
                          )}
                          {report.reported_url && (
                            <div className="text-xs text-slate-500 break-all">url: {report.reported_url}</div>
                          )}
                          {report.details && (
                            <div className="text-xs text-slate-500 mt-1 max-w-xl break-words">{report.details}</div>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-xs text-slate-500">{formatDate(report.created_at, locale)}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => dismissReport(report.id)}
                              disabled={busyAction === `report:${report.id}:dismiss`}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              {isEn ? "Dismiss" : "Verwerfen"}
                            </button>
                            {report.resource_type === "share_token" && (
                              <button
                                onClick={() => revokeShareFromReport(report)}
                                disabled={busyAction === `report:${report.id}:revoke`}
                                className="px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                              >
                                {isEn ? "Revoke share" : "Share widerrufen"}
                              </button>
                            )}
                            {report.reported_domain && (
                              <button
                                onClick={() => blockDomainFromReport(report)}
                                disabled={busyAction === `report:${report.id}:block-domain`}
                                className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-danger hover:bg-red-50 disabled:opacity-50"
                              >
                                {isEn ? "Block domain" : "Domain blockieren"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mt-0 mb-3">
              {isEn ? "Recently revoked shares" : "Zuletzt widerrufene Shares"}
            </h2>
            {data.recentRevokedShares.length === 0 ? (
              <p className="text-sm text-slate-500 m-0">-</p>
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-2 text-sm">
                {data.recentRevokedShares.map((item) => (
                  <li key={item.token} className="border border-slate-100 rounded-lg p-2">
                    <div className="font-mono break-all">{item.token}</div>
                    <div className="text-xs text-slate-500">{formatDate(item.revoked_at, locale)}</div>
                    {item.revoked_reason && <div className="text-xs text-slate-500">{item.revoked_reason}</div>}
                    <button
                      onClick={() => reinstateShareToken(item.token)}
                      disabled={busyAction === `reinstate:share:${item.token}`}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isEn ? "Reinstate share" : "Share freigeben"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mt-0 mb-3">
              {isEn ? "Restricted users" : "Gesperrte Nutzer"}
            </h2>
            {data.restrictedUsers.length === 0 ? (
              <p className="text-sm text-slate-500 m-0">-</p>
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-2 text-sm">
                {data.restrictedUsers.map((item) => (
                  <li key={item.id} className="border border-slate-100 rounded-lg p-2">
                    <div className="font-mono break-all">{item.id}</div>
                    <div className="text-xs text-slate-500">
                      sharing_disabled_until: {formatDate(item.sharing_disabled_until, locale)}
                    </div>
                    <div className="text-xs text-slate-500">
                      suspended_until: {formatDate(item.suspended_until, locale)}
                    </div>
                    <div className="text-xs text-slate-500">status: {item.account_status || "-"}</div>
                    <button
                      onClick={() => reinstateUser(item.id)}
                      disabled={busyAction === `reinstate:user:${item.id}`}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isEn ? "Reinstate user" : "Nutzer freigeben"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mt-0 mb-3">
              {isEn ? "Blocked domains" : "Blockierte Domains"}
            </h2>
            {data.blockedDomains.length === 0 ? (
              <p className="text-sm text-slate-500 m-0">-</p>
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-2 text-sm">
                {data.blockedDomains.map((item) => (
                  <li key={item.id} className="border border-slate-100 rounded-lg p-2">
                    <div className="font-semibold">{item.domain_pattern}</div>
                    <div className="text-xs text-slate-500">scope: {item.block_scope}</div>
                    {item.reason && <div className="text-xs text-slate-500">{item.reason}</div>}
                    <div className="text-xs text-slate-500">{formatDate(item.created_at, locale)}</div>
                    <button
                      onClick={() => reinstateDomain(item.domain_pattern)}
                      disabled={busyAction === `reinstate:domain:${item.domain_pattern}`}
                      className="mt-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {isEn ? "Lift domain block" : "Domain freigeben"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700 mt-0 mb-3">
              {isEn ? "Top domains (aggregate)" : "Top-Domains (aggregiert)"}
            </h2>
            {data.topDomains.length === 0 ? (
              <p className="text-sm text-slate-500 m-0">-</p>
            ) : (
              <ul className="m-0 p-0 list-none flex flex-col gap-1 text-sm">
                {data.topDomains.map((item) => (
                  <li key={item.domain} className="flex justify-between border-b border-slate-100 py-1">
                    <span>{item.domain}</span>
                    <strong>{item.count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}
