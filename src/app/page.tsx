import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  Globe,
  Layers3,
  Palette,
  Plug,
  SearchCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const features = [
  {
    icon: Blocks,
    badge: "Schema v1",
    title: "Canonical Block Registry & Editor",
    description:
      "Create pages and posts with 8 validated block schemas (including accessible FAQ accordions), revision snapshots, and zero-client-bloat server rendering."
  },
  {
    icon: SearchCheck,
    badge: "Rank Math + Yoast + AIOSEO",
    title: "Built-In TruSEO & Schema @graph",
    description:
      "Real-time 0–100 TruSEO scoring, Yoast Readability traffic lights, Smart Tags (%%title%%), automatic 301 redirects on slug change, and 404 monitor."
  },
  {
    icon: Plug,
    badge: "@nextpress/plugin-*",
    title: "Node Package Plugin Directory",
    description:
      "Search and install plugins by name or category just like WordPress—backed by declarative npm packages and scoped server hooks."
  },
  {
    icon: Palette,
    badge: "Appearance Studio",
    title: "Visual Theme Presets & Design Tokens",
    description:
      "Customize brand palettes, editorial typography pairings, and component radius tokens with instant live previewing across workspaces."
  },
  {
    icon: ShieldCheck,
    badge: "5-Tier RBAC",
    title: "Role Guardrails & Developer Persona",
    description:
      "Server-enforced permissions for Owner, Administrator, Developer, Editor, and Author roles with 1-click persona switching."
  },
  {
    icon: Globe,
    badge: "Multi-Site Ready",
    title: "Protected Previews & Instant Publishing",
    description:
      "Separate working draft and live published snapshots ensure unpublished edits never leak to public visitors."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      {/* Sticky Glass Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-line/80 bg-white/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white shadow-2xs">
              <Layers3 size={20} aria-hidden="true" />
            </span>
            <div>
              <span className="text-lg text-ink">
                NextPress<span className="text-brand">.js</span>
              </span>
              <span className="ml-2 hidden rounded-full bg-brand-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-brand sm:inline-block">
                v0.2
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-muted md:flex">
            <Link href="/dashboard" className="transition hover:text-brand">
              Dashboard
            </Link>
            <Link href="/seo" className="transition hover:text-brand">
              SEO Suite
            </Link>
            <Link href="/plugins" className="transition hover:text-brand">
              Plugins Directory
            </Link>
            <Link href="/appearance" className="transition hover:text-brand">
              Appearance Studio
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/s/flagship"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-xs font-semibold text-ink shadow-2xs transition hover:border-brand hover:text-brand sm:text-sm"
            >
              <Globe size={15} aria-hidden="true" />
              Live Flagship Site
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-brand sm:text-sm"
            >
              Open CMS <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="np-hero-surface border-b border-line">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/25 bg-white px-4 py-1.5 text-xs font-semibold text-brand shadow-2xs">
              <Sparkles size={14} aria-hidden="true" />
              Built-in Rank Math + Yoast + AIOSEO · Node Package Plugins · 5-Role RBAC
            </div>

            <h1 className="max-w-3xl text-[clamp(2.5rem,1.7rem+3.4vw,4.5rem)] font-semibold leading-[1.04] tracking-[-0.045em] text-ink">
              Publish with clarity. Build without limits.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              NextPress.js combines the editorial reliability of WordPress with a modern Next.js 16
              block architecture, native TruSEO &amp; Readability intelligence, Appearance presets,
              and a searchable Node.js plugin ecosystem.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-ink"
              >
                Open CMS Workspace <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                href="/plugins"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 text-sm font-semibold text-ink shadow-2xs transition hover:border-brand hover:text-brand"
              >
                <Plug size={16} className="text-brand" aria-hidden="true" />
                Explore Node Plugins
              </Link>
              <Link
                href="/s/flagship"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-5 py-3.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
              >
                Visit /s/flagship
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-brand" aria-hidden="true" />
                Owner, Admin, Developer, Editor &amp; Author roles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-brand" aria-hidden="true" />
                Zero-config <code className="text-ink">node:sqlite</code> persistence
              </span>
            </div>
          </div>

          {/* Interactive-Look Command Preview Card */}
          <div className="relative">
            <div className="np-card-elevated relative rounded-[2rem] border border-line bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-brand">
                    Unified Editorial + SEO + Plugin Pipeline
                  </p>
                  <p className="mt-0.5 text-base font-semibold text-ink">
                    NextPress Flagship · Block &amp; Schema Inspector
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-[#DCF4E7] px-2.5 py-1 font-mono text-xs font-semibold text-success">
                    TruSEO 94/100
                  </span>
                  <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                    Published
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-line bg-canvas p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-brand">
                      %%title%% %%sep%% %%sitename%%
                    </span>
                    <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] text-muted">
                      Schema.org @graph + FAQPage
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[#1a0dab]">
                    NextPress.js — Modern Block &amp; Visual CMS for Next.js (2026)
                  </p>
                  <p className="mt-0.5 text-xs text-[#006621]">
                    http://localhost:3000/s/flagship › home
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Create, preview, and publish structured pages and posts with role-based
                    permissions, built-in SEO scoring, and npm package plugins.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-white p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Active Node Packages
                    </p>
                    <div className="mt-2 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center justify-between rounded-lg bg-canvas px-2.5 py-1.5">
                        <span className="text-ink">@nextpress/plugin-reading-time</span>
                        <span className="text-[10px] font-semibold text-success">Active</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-canvas px-2.5 py-1.5">
                        <span className="text-ink">@nextpress/plugin-prism-syntax</span>
                        <span className="text-[10px] font-semibold text-success">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-white p-3.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      1-Click Demo Personas
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {["Owner", "Admin", "Developer", "Editor", "Author"].map((r) => (
                        <span
                          key={r}
                          className="rounded-lg border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ink px-4 py-3 text-white">
                <span className="text-xs font-medium sm:text-sm">
                  Switch between all 5 roles with 1 click on the login screen
                </span>
                <Link
                  href="/login"
                  className="rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white hover:text-ink"
                >
                  Quick Demo Sign-In →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Pillar Architecture Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-22">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              Complete CMS Architecture
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Everything you love about WordPress, engineered for Next.js.
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              No PHP legacy debt, no unverified zip uploads, and no fragmented page-builder shortcodes.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, badge, title, description }) => (
              <article
                key={title}
                className="np-card-elevated flex flex-col justify-between rounded-3xl border border-line bg-canvas/60 p-6 transition hover:-translate-y-1 hover:border-brand/50 hover:bg-white"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-line bg-white px-2.5 py-0.5 font-mono text-[11px] font-semibold text-muted">
                      {badge}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-canvas">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <span>© {new Date().getFullYear()} NextPress.js · Structured Block &amp; Visual CMS</span>
          <span>Powered by Next.js 16, React 19, SQLite &amp; Node Package Extensions</span>
        </div>
      </footer>
    </main>
  );
}
