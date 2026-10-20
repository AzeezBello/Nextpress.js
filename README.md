# NextPress.js

**A modern, WordPress-inspired content management system and visual website builder built with Next.js.**

NextPress.js serves both people building their own websites and teams delivering websites for clients. It combines a structured, versioned block document schema (`schemaVersion: 1`) with role-based editorial workflows, private draft previews, revision recovery, and fast server-rendered public pages.

---

## Product Principles

1. **One canonical content model.** The block editor, responsive previewer, and public renderer all operate on the same validated, versioned `ContentDocument` format.
2. **Core CMS first.** Pages, posts, taxonomies, media metadata, role-based access control, drafts, previews, revisions, and publishing are built on solid server-side foundations.
3. **Secure by default.** Server-side authorization (`requireSession`, `hasPermission`), runtime block validation (`validateAndNormalizeBlock`), URL sanitization (`sanitizeUrl`), and strict draft/published snapshot isolation prevent privilege escalation, XSS, and draft leakage.
4. **Accessible, responsive UI.** Keyboard block reordering, focusable container-query tables, native `<dialog closedby="any">` modals with cross-browser fallbacks, balanced typography, and `prefers-reduced-motion` support are built in.
5. **Zero-config local setup.** Powered by Node.js built-in `node:sqlite` (`data/nextpress.sqlite`), NextPress.js runs out of the box after `npm install` with automatic migrations and rich seed data—no external database server required for local development.

---

## Implemented Capabilities (Milestones 0, 1, 2 & Core Milestone 3)

- **Authentication & Role-Based Access Control (`/login`):**
  - Server-side session cookies (`np_session`) backed by SQLite.
  - Five enforced site membership roles: `Owner`, `Administrator`, `Developer`, `Editor`, and `Author`.
  - Instant 1-click demo role switcher on `/login` and in the dashboard header to test permission guardrails immediately.
- **Multi-Site Workspaces:**
  - Site-scoped content, media, taxonomies, and memberships.
  - Pre-seeded with two workspaces: **NextPress Flagship** (`flagship`) and **Northwind Design Studio** (`northwind-studio`), switchable from the sidebar.
- **Pages & Posts CRUD (`/pages`, `/posts`):**
  - Create, search, filter by status (`all`, `published`, `draft`), edit, preview, publish, unpublish, and delete pages and posts.
  - Separate `document_json` (working draft) and `published_document_json` (live public snapshot) so authors can iterate on drafts without mutating live content until published.
- **Block Editor & Registered Block Schema (`/pages/[id]`, `/posts/[id]`):**
  - Eight validated block types in `BLOCK_CATALOG`: `heading`, `paragraph`, `image`, `button`, `divider`, `callout`, `columns`, and `faq` (accessible `<details>` accordion with automatic `FAQPage` JSON-LD schema).
  - Keyboard-friendly block reordering (Move Up / Move Down), duplication, removal, and a side-by-side Block Property Inspector.
  - Built-in **Responsive Preview** tab (`Desktop`, `Tablet`, `Mobile`), **SEO Intelligence Suite** tab, and **Revision History** tab with one-click version restore.
- **Built-in SEO Suite — Rank Math + Yoast SEO + AIOSEO by Default (`/seo` & Editor):**
  - **TruSEO 0–100 Score & Yoast Readability Traffic Lights:** Real-time 15-check scoring across `Basic SEO`, `Additional SEO`, `Title Readability`, and `Content Readability` (transition words, passive voice, sentence length, subheading distribution), plus **Cornerstone Content** strict mode.
  - **Smart Tags (`%%title%%`, `%%sep%%`, `%%sitename%%`, `%%tagline%%`, `%%excerpt%%`, `%%current_year%%`, `%%focuskw%%`):** Dynamic title and meta description templates at both the site level and per-item level.
  - **SERP, OpenGraph & X/Twitter Previews:** Live Desktop/Mobile Google snippet preview and social card customization.
  - **Unified Schema.org `@graph` Generator:** Emits connected JSON-LD (`Organization` / `LocalBusiness` / `Person`, `WebSite`, `BreadcrumbList`, `WebPage`, `Article` / `BlogPosting`, and automatic `FAQPage` entities extracted from `faq` blocks).
  - **Internal Link Suggestions:** Automatic keyword-matched internal linking recommendations inside the block editor with 1-click insertion.
  - **Redirections Manager & 404 Monitor:** `301`, `302`, `307`, `308`, and `410` redirects with hit tracking, **automatic `301` redirect creation** whenever a published page or post slug changes, and a 404 error log with 1-click redirect promotion.
- **Appearance Studio (`/appearance`):**
  - WordPress-inspired Appearance workspace with curated theme presets (*Editorial Indigo*, *Swiss Brutalist*, *Warm Literary*, *Forest Monograph*, *Midnight Cyber*), custom brand colors, typography pairings (`system`, `serif`, `mono`), border radius tokens, and a live theme preview canvas.
- **Node Package Plugin Runtime (`/plugins`):**
  - WordPress-style Plugins manager backed by **Node.js / npm packages** (`@nextpress/plugin-announcement-bar`, `@nextpress/plugin-reading-time`, `@nextpress/plugin-prism-syntax`, `@nextpress/plugin-web-vitals`, or any custom `@scope/nextpress-plugin-*` package).
  - Install from the official catalog or register custom npm packages, toggle active/inactive state per site, edit JSON runtime configuration, and execute server-rendered hooks (`public:announcement_bar`, `content:before_article`, `content:after_article`, `seo:schema_graph`, `public:footer_badge`).
- **Protected Previews & Public Rendering:**
  - Private draft preview at `/preview/[id]` (requires authenticated site membership; sets `noindex, nofollow`).
  - Public site rendering at `/s/[siteSlug]`, `/s/[siteSlug]/[slug]`, and `/s/[siteSlug]/blog/[slug]` with dynamic `generateMetadata`, OpenGraph tags, Schema.org `@graph`, redirect matching, 404 logging, `/sitemap.xml`, and `/robots.txt`.
- **Media Library (`/media`) & Site Settings (`/settings`):**
  - Register media assets with MIME allowlist validation, 10 MB size limit, required `alt` text, and direct selection inside Image blocks.
  - Configure site identity, custom domain, default SEO metadata, shared theme tokens, and categories/tags.
  - Audit log tracking (`audit_logs`) surfaced on `/dashboard`.

---

## Pre-Seeded Demo Accounts

All demo accounts share the default password `nextpress123` (or you can switch between them with 1 click in the UI):

| Name | Email | Role (`flagship`) | Permissions Summary |
|---|---|---|---|
| **Ada Lovelace** | `ada@nextpress.dev` | `Owner` | Full control over site settings, memberships, media, and publishing |
| **Alex Rivera** | `alex@nextpress.dev` | `Administrator` | Manages site configuration, theme tokens, media, and all content publishing |
| **Devon Park** | `devon@nextpress.dev` | `Developer` | Installs and configures Node package plugins, Appearance theme tokens, technical SEO/schema, and content |
| **Elena Rostova** | `elena@nextpress.dev` | `Editor` | Creates, edits, previews, publishes, and unpublishes any page or post |
| **Marcus Vance** | `marcus@nextpress.dev` | `Author` | Creates and edits own drafts and media; cannot publish or modify site settings |

---

## Requirements & Quickstart

- **Node.js:** `v22.5+` or `v24+` (uses built-in `node:sqlite`)
- **npm:** `v10+`

### Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. (Optional) Copy environment variables template:

   ```bash
   cp .env.example .env.local
   ```

   By default, NextPress.js stores its SQLite database at `data/nextpress.sqlite` automatically. You can override the path with `NEXTPRESS_DB_PATH`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the application:
   - **Landing Page:** [http://localhost:3000](http://localhost:3000)
   - **Sign In / Role Switcher:** [http://localhost:3000/login](http://localhost:3000/login)
   - **CMS Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
   - **Live Public Flagship Site:** [http://localhost:3000/s/flagship](http://localhost:3000/s/flagship)
   - **Live Client Studio Site:** [http://localhost:3000/s/northwind-studio](http://localhost:3000/s/northwind-studio)

---

## Available Scripts

```bash
npm run dev       # Start the local Next.js development server
npm run build     # Create an optimized production build
npm run start     # Start the production server from a completed build
npm run typecheck # Run TypeScript compiler checks (tsc --noEmit)
npm run lint      # Run ESLint flat-config checks
npm test          # Run automated unit & integration tests (node:test)
```

---

## Route & Module Architecture

```text
nextpress/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI (typecheck, lint, test, build)
├── docs/
│   ├── ARCHITECTURE.md               # Proposed modular monolith architecture
│   ├── AUDIT-REPORT.md               # Milestone 0 repository audit report
│   ├── BRANCH-PROTECTION.md          # CI gates & GitHub branch protection setup
│   └── REPOSITORY-AUDIT-CHECKLIST.md # Baseline audit checklist
├── public/
│   └── nextpress-mark.svg            # Default vector emblem
├── src/
│   ├── app/
│   │   ├── (dashboard)/              # Authenticated CMS workspace routes
│   │   │   ├── dashboard/page.tsx    # Overview metrics, recent items & audit feed
│   │   │   ├── pages/page.tsx        # Pages directory & creation modal
│   │   │   ├── pages/[id]/page.tsx   # Page block editor, preview, SEO & revisions
│   │   │   ├── posts/page.tsx        # Posts directory & creation modal
│   │   │   ├── posts/[id]/page.tsx   # Post block editor, taxonomies & revisions
│   │   │   ├── media/page.tsx        # Media library manager
│   │   │   ├── appearance/page.tsx   # Appearance Studio (theme presets, typography & tokens)
│   │   │   ├── plugins/page.tsx      # Node Package Plugin Manager (@nextpress/plugin-*)
│   │   │   ├── seo/page.tsx          # SEO Command Center (Rank Math + Yoast + AIOSEO suite)
│   │   │   └── settings/page.tsx     # Site identity, theme tokens, roles & taxonomies
│   │   ├── login/page.tsx            # Sign-in form & 1-click demo persona switcher
│   │   ├── preview/[id]/page.tsx     # Protected private draft preview route
│   │   ├── s/[siteSlug]/             # Public site rendering routes
│   │   │   ├── page.tsx              # Public site home page & latest posts
│   │   │   ├── [slug]/page.tsx       # Public published page renderer
│   │   │   └── blog/[slug]/page.tsx  # Public published blog post renderer
│   │   ├── globals.css               # Tailwind v4 @theme tokens & responsive table styles
│   │   ├── layout.tsx                # Root HTML layout
│   │   ├── page.tsx                  # NextPress.js product landing page
│   │   ├── robots.ts                 # Dynamic robots.txt generator
│   │   └── sitemap.ts                # Dynamic sitemap.xml generator
│   ├── components/
│   │   ├── appearance-studio.tsx     # WordPress-style theme preset & design token customizer
│   │   ├── block-editor.tsx          # Interactive block editor, TruSEO/Readability & revisions
│   │   ├── block-renderer.tsx        # Server-safe React renderer for ContentDocument
│   │   ├── content-table.tsx         # Container-query table, SEO scores & native <dialog>
│   │   ├── dashboard-shell.tsx       # Authenticated shell with header role switcher
│   │   ├── media-manager.tsx         # Media asset grid & registration dialog
│   │   ├── plugins-manager.tsx       # Node package plugin catalog, installer & JSON config UI
│   │   ├── public-site-shell.tsx     # Public site header, nav, plugin hook slots & footer
│   │   ├── seo-hub.tsx               # SEO Command Center (audit, redirects, 404s, schema)
│   │   ├── sidebar-nav.tsx           # Workspace navigation & multi-site switcher
│   │   ├── sign-in-form.tsx          # Accessible autofill-compliant login form
│   │   └── site-settings-form.tsx    # Site identity, design tokens & taxonomy forms
│   └── lib/
│       ├── actions.ts                # Server Actions for auth, CRUD, SEO, appearance & plugins
│       ├── auth.ts                   # Server session helpers (getCurrentSession, requireSession)
│       ├── content-types.ts          # Block schemas, validators, URL sanitizer & migrations
│       ├── db.ts                     # SQLite database, migrations, seed data & queries
│       ├── permissions.ts            # RBAC permission matrix (Owner, Admin, Editor, Author)
│       ├── plugins.ts                # Node package plugin registry, validators & hook types
│       ├── seo-engine.ts             # TruSEO + Readability scorer, Smart Tags & Schema @graph
│       └── utils.ts                  # Class name utilities
├── tests/
│   ├── cms.test.mts                  # Automated unit & integration test suite
│   └── register-alias.mjs            # Module path alias hook for node:test
├── PRD.md                            # Product Requirements Document (v0.2)
├── README.md                         # Project documentation
└── package.json
```

---

## Canonical Content Document Contract

Every page and post stores a validated `ContentDocument` (`schemaVersion: 1`):

```ts
type ContentDocument = {
  schemaVersion: number;
  blocks: ContentBlock[];
};

type ContentBlock = {
  id: string;
  type: "heading" | "paragraph" | "image" | "button" | "divider" | "callout" | "columns" | "faq";
  version: number;
  props: Record<string, unknown>;
  children?: ContentBlock[];
};
```

All incoming documents pass through `validateAndMigrateDocument()` and `validateAndNormalizeBlock()` in `src/lib/content-types.ts` before persistence and rendering, and all links/image sources pass through `sanitizeUrl()`.

---

## Development Roadmap

- **Phase 0 — Audit & Baseline:** ✅ Complete (`docs/AUDIT-REPORT.md`)
- **Phase 1 — CMS Foundation:** ✅ Complete (Auth, RBAC, SQLite schema, multi-site, Pages/Posts/Media/Settings CRUD)
- **Phase 2 — Publishing Vertical Slice:** ✅ Complete (Block schema & registry, Block Editor, Protected Preview, Public Renderer, SEO, Sitemap/Robots)
- **Phase 3 — Editorial Completeness:** 🟡 In Progress (Revisions, Taxonomies, Audit Logs, and Media Validation complete; S3 binary upload adapter & scheduled publishing worker planned next)
- **Phase 4 — Visual Builder:** ⏳ Planned (Drag-and-drop canvas manipulation, saved section templates, header/footer layout builder)
- **Phase 5 — Extensibility:** ⏳ Planned (Custom content types, REST/webhook APIs, import/export, PostgreSQL adapter)
