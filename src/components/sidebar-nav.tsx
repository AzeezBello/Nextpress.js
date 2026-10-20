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
  Settings2
} from "lucide-react";
import type { SessionContext } from "@/lib/db";
import { switchSiteAction } from "@/lib/actions";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pages", label: "Pages", icon: Files },
  { href: "/posts", label: "Posts", icon: BookOpenText },
  { href: "/media", label: "Media", icon: Image },
  { href: "/appearance", label: "Appearance", icon: Palette },
  { href: "/plugins", label: "Plugins", icon: Plug },
  { href: "/seo", label: "SEO Suite", icon: SearchCheck },
  { href: "/settings", label: "Settings", icon: Settings2 }
];

export function SidebarNav({
  active,
  session
}: {
  active: string;
  session: SessionContext;
}) {
  return (
    <aside className="flex w-full flex-col border-b border-line bg-white p-4 md:min-h-screen md:w-64 md:border-b-0 md:border-r md:p-5">
      <Link href="/" className="flex items-center gap-3 px-2 py-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white">
          <Layers3 size={20} aria-hidden="true" />
        </span>
        <span className="font-semibold tracking-tight">
          NextPress<span className="text-brand">.js</span>
        </span>
      </Link>

      {/* Active Site Switcher */}
      <div className="mt-5 rounded-2xl border border-line bg-canvas p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Active Site
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-ink">
          {session.activeSite.name}
        </p>
        <p className="text-xs text-muted">
          Role: <span className="font-semibold capitalize text-brand">{session.role}</span>
        </p>

        {session.memberships.length > 1 ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-line pt-2.5">
            {session.memberships.map((m) => {
              const isCurrent = m.site.id === session.activeSite.id;
              return (
                <form key={m.site.id} action={switchSiteAction}>
                  <input type="hidden" name="siteId" value={m.site.id} />
                  <button
                    type="submit"
                    disabled={isCurrent}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                      isCurrent
                        ? "bg-brand text-white"
                        : "border border-line bg-white text-muted hover:text-ink"
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
          className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          <Globe size={13} aria-hidden="true" />
          Visit Public Site
          <ExternalLink size={12} aria-hidden="true" />
        </Link>
      </div>

      <p className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        Workspace
      </p>
      <nav
        aria-label="Main navigation"
        className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:flex md:flex-col"
      >
        {items.map(({ href, label, icon: Icon }) => {
          const selected = active === href || active.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={selected ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${
                selected
                  ? "bg-brand-soft font-semibold text-brand"
                  : "text-muted hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden rounded-2xl bg-canvas p-4 md:block">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-ink">SQLite Persistence</p>
          <span className="h-2 w-2 rounded-full bg-brand" aria-hidden="true" />
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">
          Connected to <code className="text-ink">data/nextpress.sqlite</code> with RBAC & schema v1.
        </p>
      </div>
    </aside>
  );
}
