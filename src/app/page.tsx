import Link from "next/link";
import { ArrowRight, Blocks, Globe, Layers3, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    icon: Blocks,
    title: "Structured content & block registry",
    description: "Create pages and posts with validated block schemas, revision snapshots, and safe server-side rendering."
  },
  {
    icon: Layers3,
    title: "One system, two editors",
    description: "Start with block editing and responsive previews, using a single canonical JSON document model."
  },
  {
    icon: ShieldCheck,
    title: "Publishing with role guardrails",
    description: "Server-side authorization enforces Owner, Admin, Editor, and Author permissions with zero draft leakage."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white">
            <Layers3 size={21} aria-hidden="true" />
          </span>
          <span className="text-lg">NextPress<span className="text-brand">.js</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/s/flagship"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:border-brand hover:text-brand"
          >
            <Globe size={15} aria-hidden="true" />
            Live Flagship Site
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand"
          >
            Open CMS Dashboard <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pb-28 lg:pt-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm text-muted shadow-sm">
            <Sparkles size={15} className="text-brand" aria-hidden="true" />
            Milestones 1 & 2 Active · SQLite + Block Editor + Public Renderer
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Publish with clarity. Build without limits.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
            NextPress.js is a modern CMS for personal websites and client work, featuring role-based authentication, a validated block editor, private previews, and responsive public rendering.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-ink"
            >
              Open CMS Workspace <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link
              href="/s/flagship"
              className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-6 py-3.5 font-medium transition hover:border-brand hover:text-brand"
            >
              Visit Published Site (/s/flagship)
            </Link>
          </div>
          <p className="mt-5 text-xs leading-5 text-muted">
            Pre-seeded with demo roles (Owner, Admin, Editor, Author) and two multi-site workspaces (<code className="text-ink">flagship</code> &amp; <code className="text-ink">northwind-studio</code>).
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-5 rounded-[2.5rem] bg-brand-soft blur-2xl" aria-hidden="true" />
          <div className="relative rounded-[2rem] border border-line bg-white p-4 shadow-soft sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">Live Publishing Pipeline</p>
                <p className="mt-1 text-lg font-semibold">Create → Edit Blocks → Preview → Publish</p>
              </div>
              <span className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand">Published</span>
            </div>
            <div className="mt-5 grid grid-cols-[74px_1fr] gap-4">
              <div className="space-y-3 rounded-2xl bg-canvas p-3">
                <div className="h-2 w-8 rounded bg-line" />
                <div className="h-8 rounded-lg bg-brand" />
                <div className="h-8 rounded-lg bg-white" />
                <div className="h-8 rounded-lg bg-white" />
                <div className="h-8 rounded-lg bg-white" />
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl bg-canvas p-5 sm:p-7">
                  <div className="h-2 w-20 rounded bg-brand/40" />
                  <div className="mt-4 h-5 w-4/5 rounded bg-ink/90" />
                  <div className="mt-2 h-5 w-3/5 rounded bg-ink/70" />
                  <div className="mt-4 h-2 w-full rounded bg-line" />
                  <div className="mt-2 h-2 w-4/5 rounded bg-line" />
                  <div className="mt-5 h-9 w-28 rounded-full bg-brand" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-line p-3">
                    <div className="h-12 rounded-lg bg-brand-soft" />
                    <div className="mt-3 h-2 w-4/5 rounded bg-line" />
                    <div className="mt-2 h-2 w-3/5 rounded bg-line" />
                  </div>
                  <div className="rounded-xl border border-line p-3">
                    <div className="h-12 rounded-lg bg-[#F8EBD9]" />
                    <div className="mt-3 h-2 w-4/5 rounded bg-line" />
                    <div className="mt-2 h-2 w-3/5 rounded bg-line" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-white">
              <span className="text-sm">Ready to edit your first page?</span>
              <Link href="/login" className="rounded-full bg-white/15 px-3 py-1.5 text-xs hover:bg-white/25">
                Sign in with 1 click →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">The foundation</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">A reliable CMS before a bigger builder.</h2>
            <p className="mt-4 leading-7 text-muted">The complete publishing journey is wired end-to-end on a versioned block schema and local SQLite persistence.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-2xl border border-line bg-canvas p-6 transition hover:-translate-y-1 hover:shadow-soft">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span>© {new Date().getFullYear()} NextPress.js</span>
        <span>Built to evolve, one reliable release at a time.</span>
      </footer>
    </main>
  );
}
