import React from "react";
import Link from "next/link";
import { Layers3 } from "lucide-react";
import type { ContentSummary, SiteRecord } from "@/lib/content-types";
import { listSitePlugins } from "@/lib/db";

export function PublicSiteShell({
  site,
  navPages,
  activeSlug,
  previewBanner,
  children
}: {
  site: SiteRecord;
  navPages: ContentSummary[];
  activeSlug?: string;
  previewBanner?: React.ReactNode;
  children: React.ReactNode;
}) {
  const activePlugins = listSitePlugins(site.id).filter((p) => p.enabled);
  const bannerPlugin = activePlugins.find((p) => p.hooks.includes("site:headerBanner"));
  const footerBadgePlugin = activePlugins.find((p) => p.hooks.includes("site:footerBadge"));

  const fontClass =
    site.themeSettings.headingFont === "serif"
      ? "font-serif"
      : site.themeSettings.headingFont === "mono"
        ? "font-mono"
        : "font-sans";

  return (
    <div
      className={`min-h-screen flex flex-col ${fontClass}`}
      style={{ backgroundColor: site.themeSettings.backgroundColor || "#F6F7F4" }}
    >
      {previewBanner}

      {bannerPlugin ? (
        <div
          className="px-4 py-2 text-center text-xs font-medium text-white"
          style={{ backgroundColor: site.themeSettings.primaryColor || "#176B4D" }}
        >
          <span>{String(bannerPlugin.config.bannerText || "Announcement")}</span>
          {bannerPlugin.config.ctaLabel ? (
            <Link
              href={String(bannerPlugin.config.ctaHref || `/s/${site.slug}`)}
              className="ml-3 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-white/30"
            >
              {String(bannerPlugin.config.ctaLabel)} →
            </Link>
          ) : null}
        </div>
      ) : null}

      <header className="border-b border-line bg-white/90 backdrop-blur-xs">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href={`/s/${site.slug}`} className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-white"
              style={{ backgroundColor: site.themeSettings.primaryColor || "#176B4D" }}
            >
              <Layers3 size={18} aria-hidden="true" />
            </span>
            <div>
              <span className="text-base font-semibold tracking-tight text-ink">
                {site.name}
              </span>
              {site.tagline ? (
                <p className="hidden text-xs text-muted sm:block">{site.tagline}</p>
              ) : null}
            </div>
          </Link>

          <nav aria-label="Public site navigation" className="flex flex-wrap items-center gap-2">
            {navPages.map((p) => {
              const href = p.slug === "home" ? `/s/${site.slug}` : `/s/${site.slug}/${p.slug}`;
              const isCurrent = activeSlug === p.slug;
              return (
                <Link
                  key={p.id}
                  href={href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    isCurrent
                      ? "bg-brand-soft text-brand"
                      : "text-muted hover:bg-canvas hover:text-ink"
                  }`}
                >
                  {p.title}
                </Link>
              );
            })}
            <Link
              href="/dashboard"
              className="ml-2 rounded-full border border-line bg-canvas px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              CMS Dashboard →
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12 sm:py-16">
        {children}
      </main>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted sm:flex-row">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              © {new Date().getFullYear()} {site.name}. Powered by NextPress.js.
            </span>
            {footerBadgePlugin ? (
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                {String(footerBadgePlugin.config.badgeLabel || "CWV Passing")}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            <Link href={`/s/${site.slug}`} className="hover:text-ink">
              Home
            </Link>
            <Link href="/sitemap.xml" className="hover:text-ink">
              Sitemap
            </Link>
            <Link href="/dashboard" className="hover:text-ink">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
