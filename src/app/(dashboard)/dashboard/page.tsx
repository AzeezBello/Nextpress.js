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
  Plus
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireSession } from "@/lib/auth";
import { listAuditLogs, listContentItems, listMediaAssets } from "@/lib/db";

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
  const auditLogs = listAuditLogs(siteId, 6);

  const stats = [
    {
      label: "Published pages & posts",
      value: String(publishedCount).padStart(2, "0"),
      note: `${draftCount} in draft`,
      icon: Layers3,
      href: "/pages"
    },
    {
      label: "Editorial posts",
      value: String(posts.length).padStart(2, "0"),
      note: `${pages.length} static pages`,
      icon: FileText,
      href: "/posts"
    },
    {
      label: "Media library assets",
      value: String(media.length).padStart(2, "0"),
      note: "Validated metadata",
      icon: Image,
      href: "/media"
    }
  ];

  return (
    <DashboardShell
      active="/dashboard"
      title="Overview"
      description={`Managing ${session.activeSite.name} (${session.activeSite.domain || siteSlug}) as ${session.role}.`}
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">
            Signed in as <strong className="text-ink">{session.user.name}</strong> ({session.role})
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            {session.activeSite.tagline || "Good work starts with a clear canvas."}
          </h2>
          <p className="mt-2 max-w-2xl leading-6 text-muted">
            {session.activeSite.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link
            href={`/s/${siteSlug}`}
            target="_blank"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            <Globe size={16} aria-hidden="true" />
            Public Site
          </Link>
          <Link
            href="/pages"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink"
          >
            <Plus size={17} aria-hidden="true" />
            Manage Pages
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, note, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-line bg-white p-5 shadow-2xs transition hover:-translate-y-0.5 hover:border-brand"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon size={19} aria-hidden="true" />
              </span>
              <span className="text-xs text-muted">{note}</span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 flex items-center justify-between text-sm text-muted group-hover:text-ink">
              <span>{label}</span>
              <ArrowUpRight size={15} aria-hidden="true" />
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Recent Content List */}
        <section className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h3 className="font-semibold">Recent pages & posts</h3>
              <p className="mt-0.5 text-xs text-muted">
                Persisted in SQLite with versioned block schemas.
              </p>
            </div>
            <Link
              href="/pages"
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
            >
              View all pages <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {allItems.slice(0, 6).map((item) => {
              const publicUrl =
                item.kind === "page"
                  ? `/s/${siteSlug}/${item.slug}`
                  : `/s/${siteSlug}/blog/${item.slug}`;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/${item.kind}s/${item.id}`}
                        className="font-semibold text-ink hover:text-brand hover:underline"
                      >
                        {item.title}
                      </Link>
                      <span className="rounded bg-canvas px-2 py-0.5 text-[11px] font-medium uppercase text-muted">
                        {item.kind}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                          item.status === "published"
                            ? "bg-brand-soft text-brand"
                            : "bg-[#F8EBD9] text-[#8A5A20]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-muted">{publicUrl}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${item.kind}s/${item.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                    >
                      <Edit3 size={12} aria-hidden="true" />
                      Edit
                    </Link>
                    <Link
                      href={`/preview/${item.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink hover:border-brand hover:text-brand"
                    >
                      <Eye size={12} aria-hidden="true" />
                      Preview
                    </Link>
                    {item.status === "published" ? (
                      <Link
                        href={publicUrl}
                        target="_blank"
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white"
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

        {/* Audit Log Feed */}
        <section className="rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-brand" aria-hidden="true" />
              <h3 className="font-semibold">Recent Activity & Audit Log</h3>
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
                    <span className="font-mono text-[11px] text-brand">{log.action}</span>
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
    </DashboardShell>
  );
}
