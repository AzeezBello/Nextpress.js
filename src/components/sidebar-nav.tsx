import Link from "next/link";
import {
  BookOpenText,
  ExternalLink,
  Files,
  Globe,
  Image,
  Layers3,
  LayoutDashboard,
  Palette,
  Plug,
  SearchCheck,
  Settings2,
  ShieldCheck
} from "lucide-react";
import type { SessionContext } from "@/lib/db";
import { switchSiteAction } from "@/lib/actions";

const navSections = [
  {
    title: "Content & Media",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/pages", label: "Pages", icon: Files },
      { href: "/posts", label: "Posts", icon: BookOpenText },
      { href: "/media", label: "Media Library", icon: Image }
    ]
  },
  {
    title: "Extend & Optimize",
    items: [
      { href: "/appearance", label: "Appearance", icon: Palette },
      { href: "/plugins", label: "Plugins", icon: Plug, badge: "npm" },
      { href: "/seo", label: "SEO Suite", icon: SearchCheck, badge: "Pro" }
    ]
  },
  {
    title: "Workspace",
    items: [{ href: "/settings", label: "Settings", icon: Settings2 }]
  }
];

export function SidebarNav({
  active,
  session
}: {
  active: string;
  session: SessionContext;
}) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-line bg-white/95 p-4 backdrop-blur-md md:sticky md:top-0 md:h-screen md:w-68 md:overflow-y-auto md:border-b-0 md:border-r md:p-5">
      {/* Brand Header */}
      <Link
        href="/"
        className="group flex items-center justify-between rounded-2xl px-2 py-1.5 transition hover:bg-canvas"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-2xs transition group-hover:scale-105">
            <Layers3 size={20} aria-hidden="true" />
          </span>
          <div>
            <span className="block text-base font-semibold tracking-tight text-ink">
              NextPress<span className="text-brand">.js</span>
            </span>
            <span className="block font-mono text-[10px] text-muted">
              v0.2 · Block & SEO CMS
            </span>
          </div>
        </div>
      </Link>

      {/* Active Site Workspace Switcher Card */}
      <div className="mt-4 rounded-2xl border border-line bg-canvas/80 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Active Workspace
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold capitalize text-brand">
            <ShieldCheck size={11} aria-hidden="true" />
            {session.role}
          </span>
        </div>

        <p className="mt-1.5 truncate text-sm font-semibold text-ink">
          {session.activeSite.name}
        </p>
        <p className="truncate font-mono text-[11px] text-muted">
          /s/{session.activeSite.slug}
        </p>

        {session.memberships.length > 1 ? (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
            {session.memberships.map((m) => {
              const isCurrent = m.site.id === session.activeSite.id;
              return (
                <form key={m.site.id} action={switchSiteAction} className="flex-1">
                  <input type="hidden" name="siteId" value={m.site.id} />
                  <button
                    type="submit"
                    disabled={isCurrent}
                    className={`w-full truncate rounded-lg px-2 py-1 text-[11px] font-semibold transition ${
                      isCurrent
                        ? "bg-brand text-white shadow-2xs"
                        : "border border-line bg-white text-muted hover:border-brand/40 hover:text-ink"
                    }`}
                  >
                    {m.site.slug}
                  </button>
                </form>
              );
            })}
          </div>
        ) : null}

        <Link
          href={`/s/${session.activeSite.slug}`}
          target="_blank"
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand hover:text-brand"
        >
          <Globe size={13} aria-hidden="true" />
          Visit Live Site
          <ExternalLink size={11} aria-hidden="true" />
        </Link>
      </div>

      {/* Grouped Navigation Sections */}
      <nav aria-label="Main navigation" className="mt-5 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
              {section.title}
            </p>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:flex md:flex-col">
              {section.items.map(({ href, label, icon: Icon, badge }) => {
                const selected = active === href || active.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={selected ? "page" : undefined}
                    className={`group flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-xs font-medium transition ${
                      selected
                        ? "bg-brand text-white font-semibold shadow-2xs"
                        : "text-muted hover:bg-canvas hover:text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        aria-hidden="true"
                        className={
                          selected
                            ? "text-white"
                            : "text-muted transition group-hover:text-brand"
                        }
                      />
                      <span>{label}</span>
                    </span>
                    {badge ? (
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                          selected
                            ? "bg-white/20 text-white"
                            : "bg-brand-soft text-brand"
                        }`}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Runtime Health Footer */}
      <div className="mt-auto hidden pt-6 md:block">
        <div className="rounded-2xl border border-line bg-canvas/80 p-3.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink">SQLite + Schema v1</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-success">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
              Online
            </span>
          </div>
          <p className="mt-1 text-[11px] leading-4 text-muted">
            TruSEO, Yoast Readability &amp; Node plugin runtime active.
          </p>
        </div>
      </div>
    </aside>
  );
}
