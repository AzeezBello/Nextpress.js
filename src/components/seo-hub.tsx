"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileSearch,
  Globe,
  Plus,
  Sparkles,
  Star,
  Trash2
} from "lucide-react";
import type {
  ContentSummary,
  NotFoundLogRecord,
  RedirectRecord,
  RedirectStatusCode,
  SeoMetadata,
  SiteRecord
} from "@/lib/content-types";
import { SMART_TAGS } from "@/lib/seo-engine";
import {
  clear404LogsAction,
  createRedirectAction,
  deleteRedirectAction,
  saveSiteSettingsAction
} from "@/lib/actions";

export function SeoHub({
  site,
  contentItems,
  redirects,
  notFoundLogs,
  canPublish,
  canManageSite
}: {
  site: SiteRecord;
  contentItems: ContentSummary[];
  redirects: RedirectRecord[];
  notFoundLogs: NotFoundLogRecord[];
  canPublish: boolean;
  canManageSite: boolean;
}) {
  const [activeTab, setActiveTab] = useState<
    "audit" | "redirects" | "404-monitor" | "local-knowledge"
  >("audit");
  const [cornerstoneOnly, setCornerstoneOnly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  // New Redirect form state
  const [sourcePath, setSourcePath] = useState("");
  const [destinationUrl, setDestinationUrl] = useState(`/s/${site.slug}/home`);
  const [statusCode, setStatusCode] = useState<RedirectStatusCode>(301);
  const [isRegex, setIsRegex] = useState(false);
  const [redirectNote, setRedirectNote] = useState("");

  // Site-wide SEO Defaults state (Knowledge Graph, Local SEO, Smart Tag templates, Robots.txt)
  const [seoDefaults, setSeoDefaults] = useState<SeoMetadata>({
    metaTitle: site.seoDefaults.metaTitle || site.name,
    metaDescription: site.seoDefaults.metaDescription || site.description,
    canonicalUrl: site.seoDefaults.canonicalUrl || "",
    titleSeparator: site.seoDefaults.titleSeparator || "—",
    titleTemplatePage: site.seoDefaults.titleTemplatePage || "%%title%% %%sep%% %%sitename%%",
    titleTemplatePost: site.seoDefaults.titleTemplatePost || "%%title%% %%sep%% %%sitename%%",
    knowledgeGraphType: site.seoDefaults.knowledgeGraphType || "Organization",
    organizationName: site.seoDefaults.organizationName || site.name,
    organizationLogo: site.seoDefaults.organizationLogo || "/nextpress-mark.svg",
    localBusinessCategory: site.seoDefaults.localBusinessCategory || "SoftwareCompany",
    phone: site.seoDefaults.phone || "",
    streetAddress: site.seoDefaults.streetAddress || "",
    addressLocality: site.seoDefaults.addressLocality || "",
    postalCode: site.seoDefaults.postalCode || "",
    addressCountry: site.seoDefaults.addressCountry || "US",
    openingHours: site.seoDefaults.openingHours || "Mo-Fr 09:00-18:00",
    socialProfiles: site.seoDefaults.socialProfiles || [],
    customRobotsTxt: site.seoDefaults.customRobotsTxt || ""
  });

  const avgScore =
    contentItems.length > 0
      ? Math.round(
          contentItems.reduce((acc, item) => acc + (item.seoScore ?? 70), 0) /
            contentItems.length
        )
      : 100;

  const cornerstoneCount = contentItems.filter((c) => c.isCornerstone).length;
  const visibleItems = cornerstoneOnly
    ? contentItems.filter((c) => c.isCornerstone)
    : contentItems;

  function handleCreateRedirect(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await createRedirectAction({
        sourcePath,
        destinationUrl,
        statusCode,
        isRegex,
        note: redirectNote
      });
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Could not create redirect." });
      } else {
        setFeedback({
          type: "ok",
          message: `Saved ${statusCode} redirect for ${sourcePath}.`
        });
        setSourcePath("");
        setRedirectNote("");
      }
    });
  }

  function handleDeleteRedirect(id: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await deleteRedirectAction(id);
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Could not delete redirect." });
      } else {
        setFeedback({ type: "ok", message: "Redirect rule deleted." });
      }
    });
  }

  function handleConvert404ToRedirect(path404: string) {
    setSourcePath(path404);
    setDestinationUrl(`/s/${site.slug}/home`);
    setStatusCode(301);
    setRedirectNote(`Converted from 404 Monitor log (${path404})`);
    setActiveTab("redirects");
    setFeedback({
      type: "ok",
      message: `Pre-filled 301 redirect for "${path404}". Confirm destination URL below and click Save Redirect.`
    });
  }

  function handleClear404(logId?: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await clear404LogsAction(logId);
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Failed to clear 404 log." });
      } else {
        setFeedback({
          type: "ok",
          message: logId ? "Dismissed 404 log entry." : "Cleared all 404 monitor logs."
        });
      }
    });
  }

  function handleSaveGlobalSeo(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await saveSiteSettingsAction({
        name: site.name,
        tagline: site.tagline,
        description: site.description,
        domain: site.domain ?? "",
        themeSettings: site.themeSettings,
        seoDefaults
      });
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Failed to save SEO settings." });
      } else {
        setFeedback({
          type: "ok",
          message: "Saved Knowledge Graph, Local SEO, Smart Tag templates, and robots.txt rules."
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            TruSEO Site Health
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-semibold ${
                avgScore >= 80
                  ? "text-success"
                  : avgScore >= 55
                    ? "text-warning"
                    : "text-danger"
              }`}
            >
              {avgScore}/100
            </span>
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
              {avgScore >= 80 ? "Good" : avgScore >= 55 ? "OK" : "Needs Work"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Across {contentItems.length} pages & posts on {site.name}
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Cornerstone Pillar Content
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink">{cornerstoneCount}</p>
          <p className="mt-1 text-xs text-muted">
            High-priority pages prioritized in internal link suggestions
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Active Redirect Rules
          </p>
          <p className="mt-2 text-3xl font-semibold text-ink">{redirects.length}</p>
          <p className="mt-1 text-xs text-muted">
            301/302/307/410/451 + Auto-Redirect on slug changes
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            404 Monitor Queue
          </p>
          <p className="mt-2 text-3xl font-semibold text-warning">{notFoundLogs.length}</p>
          <p className="mt-1 text-xs text-muted">
            Captured broken URLs ready for 1-click 301 conversion
          </p>
        </div>
      </div>

      {feedback ? (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === "err"
              ? "border-[#E9B8B8] bg-[#FBE9E9] text-danger"
              : "border-brand/30 bg-brand-soft text-brand"
          }`}
        >
          <CheckCircle2 size={15} />
          {feedback.message}
        </div>
      ) : null}

      {/* Suite Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "audit"
                ? "bg-brand text-white"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <Sparkles size={14} />
            TruSEO & Readability Audit
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("redirects")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "redirects"
                ? "bg-brand text-white"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <ArrowRightLeft size={14} />
            Redirection Manager ({redirects.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("404-monitor")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "404-monitor"
                ? "bg-brand text-white"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <AlertTriangle size={14} />
            404 Monitor ({notFoundLogs.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("local-knowledge")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === "local-knowledge"
                ? "bg-brand text-white"
                : "text-muted hover:bg-canvas hover:text-ink"
            }`}
          >
            <Compass size={14} />
            Knowledge Graph, Local SEO & Robots.txt
          </button>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <a
            href="/sitemap.xml"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <FileSearch size={12} />
            sitemap.xml
            <ExternalLink size={11} />
          </a>
          <a
            href="/robots.txt"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[11px] font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <Globe size={12} />
            robots.txt
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* TAB 1: TruSEO & Readability Content Audit */}
      {activeTab === "audit" ? (
        <section className="rounded-3xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Content SEO & Cornerstone Matrix
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                Powered by NextPress built-in Rank Math + Yoast + AIOSEO scoring engine.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-canvas px-3.5 py-1.5 text-xs font-semibold text-ink">
              <input
                type="checkbox"
                checked={cornerstoneOnly}
                onChange={(e) => setCornerstoneOnly(e.target.checked)}
                className="rounded border-line text-brand"
              />
              <Star size={13} className="text-warning" />
              Show Cornerstone Pillar Content Only ({cornerstoneCount})
            </label>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <th className="py-3 pr-4">Title & Type</th>
                  <th className="px-4 py-3">Focus Keyword</th>
                  <th className="px-4 py-3">TruSEO Score</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="py-3 pl-4 text-right">Optimize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleItems.map((item) => {
                  const score = item.seoScore ?? 70;
                  const scoreBadge =
                    score >= 80
                      ? "bg-[#DCF4E7] text-success"
                      : score >= 55
                        ? "bg-[#F8EBD9] text-warning"
                        : "bg-[#FBE9E9] text-danger";

                  return (
                    <tr key={item.id} className="hover:bg-canvas/60">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-ink">{item.title}</span>
                          {item.isCornerstone ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#F8EBD9] px-2 py-0.5 text-[10px] font-semibold text-warning">
                              ★ Cornerstone
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 font-mono text-xs text-muted">
                          {item.kind.toUpperCase()} ·{" "}
                          {item.kind === "post"
                            ? `/s/${site.slug}/blog/${item.slug}`
                            : `/s/${site.slug}/${item.slug}`}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.focusKeyword ? (
                          <code className="rounded-lg border border-line bg-canvas px-2.5 py-1 font-mono text-xs text-ink">
                            {item.focusKeyword}
                          </code>
                        ) : (
                          <span className="text-xs italic text-muted">Not set</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${scoreBadge}`}
                        >
                          {score}/100
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium capitalize text-muted">
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <Link
                          href={`/${item.kind}s/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                        >
                          Open SEO Inspector
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* TAB 2: Redirection Manager */}
      {activeTab === "redirects" ? (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          <section className="rounded-3xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">Add Redirect Rule</h2>
            <p className="mt-1 text-xs text-muted">
              Supports 301 Permanent, 302 Found, 307 Temporary, 410 Content Deleted, and 451
              Unavailable for Legal Reasons.
            </p>

            <form onSubmit={handleCreateRedirect} className="mt-4 space-y-3.5">
              <label className="block">
                <span className="text-xs font-semibold text-ink">Source Path (or Regex) *</span>
                <input
                  type="text"
                  required
                  disabled={!canPublish}
                  placeholder={`/s/${site.slug}/old-page`}
                  value={sourcePath}
                  onChange={(e) => setSourcePath(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Redirect HTTP Status Code</span>
                <select
                  disabled={!canPublish}
                  value={statusCode}
                  onChange={(e) => setStatusCode(Number(e.target.value) as RedirectStatusCode)}
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                >
                  <option value={301}>301 Permanent Move</option>
                  <option value={302}>302 Temporary Found</option>
                  <option value={307}>307 Temporary Redirect</option>
                  <option value={410}>410 Content Deleted (Gone)</option>
                  <option value={451}>451 Unavailable for Legal Reasons</option>
                </select>
              </label>

              {statusCode !== 410 && statusCode !== 451 ? (
                <label className="block">
                  <span className="text-xs font-semibold text-ink">Destination URL *</span>
                  <input
                    type="text"
                    required
                    disabled={!canPublish}
                    placeholder={`/s/${site.slug}/about`}
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                  />
                </label>
              ) : null}

              <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  disabled={!canPublish}
                  checked={isRegex}
                  onChange={(e) => setIsRegex(e.target.checked)}
                />
                Enable Regular Expression (Regex) pattern matching
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Audit Note</span>
                <input
                  type="text"
                  disabled={!canPublish}
                  placeholder="Reason for redirect..."
                  value={redirectNote}
                  onChange={(e) => setRedirectNote(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                />
              </label>

              {canPublish ? (
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-ink disabled:opacity-50"
                >
                  <Plus size={14} />
                  {isPending ? "Saving..." : "Save Redirect Rule"}
                </button>
              ) : null}
            </form>
          </section>

          <section className="rounded-3xl border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">
              Active Redirects ({redirects.length})
            </h2>
            <p className="mt-1 text-xs text-muted">
              Note: Renaming any published page or post slug automatically inserts a 301 redirect
              here.
            </p>

            <div className="mt-4 divide-y divide-line rounded-2xl border border-line">
              {redirects.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted">No redirects configured yet.</p>
              ) : (
                redirects.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-brand-soft px-2 py-0.5 font-mono text-xs font-semibold text-brand">
                          {r.statusCode}
                        </span>
                        {r.isRegex ? (
                          <span className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-muted">
                            REGEX
                          </span>
                        ) : null}
                        <code className="font-mono text-xs font-semibold text-ink">
                          {r.sourcePath}
                        </code>
                        <span className="text-xs text-muted">→</span>
                        <code className="font-mono text-xs text-brand">
                          {r.destinationUrl || "(Gone / No Destination)"}
                        </code>
                      </div>
                      {r.note ? <p className="text-xs text-muted">{r.note}</p> : null}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">
                        {r.hits} {r.hits === 1 ? "hit" : "hits"}
                      </span>
                      {canPublish ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteRedirect(r.id)}
                          className="rounded-full border border-line p-1.5 text-muted hover:border-danger hover:text-danger"
                          title="Delete redirect"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      ) : null}

      {/* TAB 3: 404 Monitor */}
      {activeTab === "404-monitor" ? (
        <section className="rounded-3xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink">404 Error Monitor</h2>
              <p className="mt-0.5 text-xs text-muted">
                Tracks visitor hits to non-existent public routes so editors can convert broken
                links into 301 redirects in one click.
              </p>
            </div>
            {canPublish && notFoundLogs.length > 0 ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleClear404()}
                className="rounded-full border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink hover:border-danger hover:text-danger"
              >
                Clear All 404 Logs
              </button>
            ) : null}
          </div>

          <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
            {notFoundLogs.length === 0 ? (
              <p className="p-8 text-center text-xs text-muted">
                No 404 errors logged for {site.name}.
              </p>
            ) : (
              notFoundLogs.map((nf) => (
                <div
                  key={nf.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono text-xs font-semibold text-danger">
                        {nf.path}
                      </code>
                      <span className="rounded-full bg-[#F8EBD9] px-2.5 py-0.5 text-[11px] font-semibold text-warning">
                        {nf.hits} {nf.hits === 1 ? "hit" : "hits"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      Referrer: {nf.referrer || "Direct"} · Last seen:{" "}
                      {new Date(nf.lastSeenAt).toLocaleString()}
                    </p>
                  </div>

                  {canPublish ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleConvert404ToRedirect(nf.path)}
                        className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-ink"
                      >
                        Create 301 Redirect
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClear404(nf.id)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-danger"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {/* TAB 4: Knowledge Graph, Local SEO, Smart Tags & Robots.txt */}
      {activeTab === "local-knowledge" ? (
        <form onSubmit={handleSaveGlobalSeo} className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Smart Tag Title Templates */}
            <section className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-lg font-semibold text-ink">
                Smart Tag Title Templates
              </h2>
              <p className="mt-1 text-xs text-muted">
                Dynamic variables automatically resolved in HTML <code>&lt;title&gt;</code>, Open
                Graph, and Schema.org output.
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {SMART_TAGS.map((t) => (
                  <span
                    key={t.tag}
                    title={`${t.label} — ${t.description}`}
                    className="rounded-lg border border-line bg-canvas px-2 py-1 font-mono text-[11px] text-brand"
                  >
                    {t.tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 space-y-3.5">
                <label className="block">
                  <span className="text-xs font-semibold text-ink">Title Separator (%%sep%%)</span>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {["—", "|", "·", "-", "»"].map((sep) => (
                      <button
                        key={sep}
                        type="button"
                        disabled={!canManageSite}
                        onClick={() => setSeoDefaults({ ...seoDefaults, titleSeparator: sep })}
                        className={`rounded-xl border px-3.5 py-1.5 font-mono text-xs font-semibold ${
                          seoDefaults.titleSeparator === sep
                            ? "border-brand bg-brand text-white"
                            : "border-line bg-canvas text-ink"
                        }`}
                      >
                        {sep}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">Default Page Title Format</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.titleTemplatePage || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, titleTemplatePage: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">Default Post Title Format</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.titleTemplatePost || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, titleTemplatePost: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">
                    Custom <code>robots.txt</code> Rules
                  </span>
                  <textarea
                    rows={4}
                    disabled={!canManageSite}
                    placeholder={"Disallow: /s/flagship/private\nAllow: /s/flagship/blog"}
                    value={seoDefaults.customRobotsTxt || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, customRobotsTxt: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas p-3 font-mono text-xs text-ink"
                  />
                </label>
              </div>
            </section>

            {/* Knowledge Graph & Local Business SEO */}
            <section className="rounded-3xl border border-line bg-white p-6">
              <h2 className="text-lg font-semibold text-ink">
                Knowledge Graph & Local Business SEO
              </h2>
              <p className="mt-1 text-xs text-muted">
                Populates Google Knowledge Panel, Organization, and LocalBusiness Schema.org JSON-LD.
              </p>

              <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-ink">Entity Type</span>
                  <select
                    disabled={!canManageSite}
                    value={seoDefaults.knowledgeGraphType || "Organization"}
                    onChange={(e) =>
                      setSeoDefaults({
                        ...seoDefaults,
                        knowledgeGraphType: e.target.value as SeoMetadata["knowledgeGraphType"]
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                  >
                    <option value="Organization">Organization</option>
                    <option value="LocalBusiness">LocalBusiness (NAP + Hours)</option>
                    <option value="Person">Person / Individual Publisher</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">Organization / Person Name</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.organizationName || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, organizationName: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">Logo URL</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.organizationLogo || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, organizationLogo: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">Phone (NAP)</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.phone || ""}
                    onChange={(e) => setSeoDefaults({ ...seoDefaults, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-ink">Street Address</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.streetAddress || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, streetAddress: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">City & Region</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.addressLocality || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, addressLocality: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">Opening Hours</span>
                  <input
                    type="text"
                    disabled={!canManageSite}
                    value={seoDefaults.openingHours || ""}
                    onChange={(e) =>
                      setSeoDefaults({ ...seoDefaults, openingHours: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                  />
                </label>
              </div>

              {canManageSite ? (
                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-full bg-brand px-6 py-2.5 text-xs font-semibold text-white hover:bg-ink disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save Global SEO & Knowledge Graph"}
                  </button>
                </div>
              ) : null}
            </section>
          </div>
        </form>
      ) : null}
    </div>
  );
}
