import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Image,
  Layers3,
  Palette,
  Plug,
  Plus,
  SearchCheck,
  Sparkles
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireSession } from "@/lib/auth";
import {
  listAuditLogs,
  listContentItems,
  listMediaAssets,
  listRedirects,
  listSitePlugins
} from "@/lib/db";

export default async function DashboardPage() {
  const session = await requireSession();
  const siteId = session.activeSite.id;
  const siteSlug = session.activeSite.slug;

  const allItems = listContentItems(siteId);
  const pages = allItems.filter((i) => i.kind === "page");
  const posts = allItems.filter((i) => i.kind === "post");
  const publishedCount = allItems.filter((i) => i.status === "published").length;
  const draftCount = allItems.filter((i) => i.status === "draft").length;
  const media = listMediaAssets(siteId);
  const plugins = listSitePlugins(siteId);
  const activePlugins = plugins.filter((p) => p.enabled);
  const redirects = listRedirects(siteId);
  const auditLogs = listAuditLogs(siteId, 6);

  const avgSeoScore =
    allItems.length > 0
      ? Math.round(
          allItems.reduce((acc, item) => acc + (item.seoScore ?? 75), 0) /
            allItems.length
        )
      : 100;

  const stats = [
    {
      label: "Published pages & posts",
      value: String(publishedCount).padStart(2, "0"),
      note: `${draftCount} in draft · ${pages.length}P / ${posts.length}B`,
      icon: Layers3,
      href: "/pages"
    },
    {
      label: "Average TruSEO score",
      value: `${avgSeoScore}/100`,
      note: "Rank Math + Yoast + AIOSEO",
      icon: SearchCheck,
      href: "/seo"
    },
    {
      label: "Active Node plugins",
      value: `${activePlugins.length}/${plugins.length}`,
      note: "npm extension packages",
      icon: Plug,
      href: "/plugins"
    },
    {
      label: "Media & 301 redirects",
      value: String(media.length).padStart(2, "0"),
      note: `${redirects.length} active redirects`,
      icon: Image,
      href: "/media"
    }
  ];

  return (
    <DashboardShell
      active="/dashboard"
      title="Workspace Overview"
      description={`Managing ${session.activeSite.name} (/s/${siteSlug}) as ${session.role}.`}
    >
      {/* Hero Command Card */}
      <section className="np-hero-surface np-card-elevated rounded-3xl border border-line p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <Sparkles size={13} aria-hidden="true" />
              Signed in as {session.user.name} ({session.role})
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {session.activeSite.tagline || "Good work starts with a clear canvas."}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              {session.activeSite.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href={`/s/${siteSlug}`}
              target="_blank"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand hover:text-brand"
            >
              <Globe size={15} aria-hidden="true" />
              Visit Live Site
              <ExternalLink size={12} aria-hidden="true" />
            </Link>
            <Link
              href="/appearance"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand hover:text-brand"
            >
              <Palette size={15} aria-hidden="true" />
              Appearance
            </Link>
            <Link
              href="/plugins"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand hover:text-brand"
            >
              <Plug size={15} aria-hidden="true" />
              Add Plugin
            </Link>
            <Link
              href="/pages"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-ink"
            >
              <Plus size={15} aria-hidden="true" />
              Manage Pages
            </Link>
          </div>
        </div>
      </section>

      {/* 4-Card Executive Metrics Row */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, note, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="np-card-elevated group rounded-2xl border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand transition group-hover:bg-brand group-hover:text-white">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-muted">
                {note}
              </span>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">{value}</p>
            <p className="mt-1 flex items-center justify-between text-xs font-semibold text-muted group-hover:text-brand">
              <span>{label}</span>
              <ArrowUpRight size={14} aria-hidden="true" />
            </p>
          </Link>
        ))}
      </div>

      {/* Main Content & Activity Columns */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Recent Content List with TruSEO & Readability Badges */}
        <section className="np-card-elevated rounded-3xl border border-line bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-ink">
                Recent Pages &amp; Editorial Posts
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                Canonical block documents (`schemaVersion: 1`) with live TruSEO &amp; Yoast Readability telemetry.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/posts"
                className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-brand"
              >
                <FileText size={13} aria-hidden="true" />
                Posts
              </Link>
              <Link
                href="/pages"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                All pages <ArrowUpRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-line">
            {allItems.slice(0, 6).map((item) => {
              const publicUrl =
                item.kind === "page" && item.slug === "home"
                  ? `/s/${siteSlug}`
                  : item.kind === "page"
                    ? `/s/${siteSlug}/${item.slug}`
                    : `/s/${siteSlug}/blog/${item.slug}`;

              const score = item.seoScore ?? 78;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 px-6 py-4 transition hover:bg-canvas/50 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/${item.kind}s/${item.id}`}
                        className="font-semibold text-ink hover:text-brand hover:underline"
                      >
                        {item.title}
                      </Link>
                      {item.isCornerstone ? (
                        <span
                          title="Cornerstone Pillar Content"
                          className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#92400E]"
                        >
                          ★ Cornerstone
                        </span>
                      ) : null}
                      <span className="rounded bg-canvas px-2 py-0.5 text-[10px] font-semibold uppercase text-muted">
                        {item.kind}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                          item.status === "published"
                            ? "bg-[#DCF4E7] text-success"
                            : "bg-[#F8EBD9] text-[#8A5A20]"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${
                          score >= 80
                            ? "bg-brand-soft text-brand"
                            : score >= 55
                              ? "bg-[#FEF3C7] text-[#92400E]"
                              : "bg-[#FEE2E2] text-danger"
                        }`}
                      >
                        SEO {score}/100
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted">{publicUrl}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${item.kind}s/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand hover:text-brand"
                    >
                      <Edit3 size={12} aria-hidden="true" />
                      Edit
                    </Link>
                    <Link
                      href={`/preview/${item.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-xl border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
                    >
                      <Eye size={12} aria-hidden="true" />
                      Preview
                    </Link>
                    {item.status === "published" ? (
                      <Link
                        href={publicUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-xl bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                      >
                        <ExternalLink size={12} aria-hidden="true" />
                        Live
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Active Node Plugins + Audit Log Feed */}
        <div className="space-y-6">
          <section className="np-card-elevated rounded-3xl border border-line bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plug size={16} className="text-brand" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-ink">
                  Active Node Package Plugins
                </h3>
              </div>
              <Link
                href="/plugins"
                className="text-xs font-semibold text-brand hover:underline"
              >
                Manage ({activePlugins.length}) →
              </Link>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {activePlugins.map((plugin) => (
                <Link
                  key={plugin.id}
                  href="/plugins"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-2.5 py-1.5 font-mono text-[11px] font-medium text-ink transition hover:border-brand hover:text-brand"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                  {plugin.packageName}
                </Link>
              ))}
            </div>
          </section>

          <section className="np-card-elevated rounded-3xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-brand" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-ink">
                  Recent Activity &amp; Audit Log
                </h3>
              </div>
            </div>
            <div className="divide-y divide-line">
              {auditLogs.length === 0 ? (
                <p className="p-5 text-xs text-muted">
                  No recent editorial mutations recorded yet. Edit or publish a page to see audit entries here.
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="px-5 py-3.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{log.actorName}</span>
                      <code className="rounded bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-brand">
                        {log.action}
                      </code>
                    </div>
                    <p className="mt-1 text-muted">
                      {typeof log.details.title === "string"
                        ? `"${log.details.title}"`
                        : log.entityId}{" "}
                      · {new Date(log.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
