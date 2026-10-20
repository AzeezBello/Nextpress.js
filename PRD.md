# NextPress.js — Product Requirements Document (PRD)

- **Document status:** Active implementation (Milestones 0, 1 & 2 complete; Milestone 3 partially implemented)
- **Version:** 0.2
- **Last updated:** 2026-10-20
- **Product name:** NextPress.js
- **Primary platform:** Responsive web application (Next.js 16 App Router + React 19 + TypeScript)
- **Delivery strategy:** Core CMS and publishable vertical slice first; visual canvas builder and extensibility follow

## 1. Executive summary

NextPress.js is a modern content management system inspired by the practical strengths of WordPress, built with Next.js and React. It supports people creating their own websites and teams building websites for clients. It begins with reliable content management and publishing, and grows into a unified block editor and visual website builder.

The product is not a WordPress theme or a React skin over WordPress. It is a standalone CMS application with its own versioned content model, editorial workflow, server-safe rendering system, role-based permissions, and extension contracts.

## 2. Problem statement

Website owners and teams need a dependable way to create, organize, preview, publish, and maintain websites without manually coding every page. They also need room to control layout and brand presentation. A CMS that focuses only on publishing can feel restrictive; a builder that focuses only on canvas editing can create inconsistent data and difficult-to-maintain pages.

NextPress.js addresses this by combining a structured content system with progressive visual editing, using a single canonical content format (`ContentDocument` `schemaVersion: 1`).

## 3. Vision

Make it possible for a user to move from an empty site to a well-structured, publishable website through a dependable CMS workflow, then use visual tools to customize the site without fragmenting content or sacrificing performance, accessibility, or maintainability.

## 4. Product & architectural decisions

### Confirmed & implemented decisions

- **Audience:** Both personal website owners and freelancers/agencies managing client websites, with site-scoped membership isolation (`flagship` and `northwind-studio` workspaces).
- **Editing:** Unified block editor (`BlockEditor`) and responsive viewport preview (`Desktop`, `Tablet`, `Mobile`) operating on one canonical `ContentDocument` schema.
- **Repository audit:** Completed in Milestone 0 (`docs/AUDIT-REPORT.md`), resolving baseline Tailwind CSS v4 PostCSS compilation and ESLint 9 flat config compatibility.
- **Technology stack:** Next.js 16.4 (App Router), React 19, TypeScript 5, Tailwind CSS 4 (`@theme` tokens), and Lucide icons.
- **Database & persistence:** Zero-config local SQLite powered by Node.js built-in `node:sqlite` (`data/nextpress.sqlite`, configurable via `NEXTPRESS_DB_PATH` for isolated testing), using versioned SQL migrations (`schema_migrations`) and relational columns + JSON documents so the persistence layer can migrate cleanly to PostgreSQL when needed.
- **Authentication & authorization:** Built-in server-side session authentication (`np_session` HTTP-only cookie backed by the `sessions` table) and server-enforced Role-Based Access Control (`owner`, `admin`, `editor`, `author`).

## 5. Target users and jobs to be done

### Persona A — Personal site owner

**Goal:** Publish and maintain a personal, portfolio, organization, or small-business website.

Needs:
- Create and update pages without programming.
- Publish reliably and see what the public page will look like.
- Manage images and metadata.
- Use templates and consistent design controls.

### Persona B — Freelancer or agency

**Goal:** Build and maintain websites for multiple clients.

Needs:
- A predictable editorial workflow.
- Clear separation of client/site content and permissions.
- Reusable patterns and templates.
- Safe previews, publishing controls, and recoverable revisions.

### Persona C — Content editor / author

**Goal:** Write and publish content while staying within assigned permissions.

Needs:
- Drafting, editing, categorization, previews, and publication guardrails.
- Accessible editing controls.
- Confidence that unpublished content is not publicly visible.

### Persona D — Future platform developer

**Goal:** Extend NextPress after the core product stabilizes.

Needs:
- Documented APIs and stable extension points.
- Validated content types and schemas.
- Clear compatibility and migration policies.

## 6. Goals and non-goals

### MVP goals (Status: Complete)

1. ✅ Users can authenticate and access only the sites and operations allowed by their role.
2. ✅ Authorized users can create, edit, preview, publish, and unpublish pages and posts.
3. ✅ Content survives reloads and application restarts in `data/nextpress.sqlite`.
4. ✅ Public routes (`/s/[siteSlug]`, `/s/[siteSlug]/[slug]`, `/s/[siteSlug]/blog/[slug]`) render published content responsively.
5. ✅ Media metadata and assets can be registered and managed safely with MIME and size validation.
6. ✅ Basic SEO metadata (`metaTitle`, `metaDescription`, `canonicalUrl`, `noIndex`, `sitemap.xml`, `robots.txt`) can be configured.
7. ✅ The block-based editor and public renderer share one versioned content model (`schemaVersion: 1`).
8. ✅ Critical workflows have automated tests (`tests/cms.test.mts`) and documented operational setup.

### Non-goals for MVP

- Complete parity with every WordPress feature.
- Running existing PHP WordPress plugins directly.
- A complete third-party plugin marketplace.
- Full visual canvas with arbitrary freeform positioning.
- E-commerce, memberships, comments, or form automation unless added to the approved scope.
- Native mobile apps.
- Microservices without a demonstrated scaling or team need.

## 7. Functional requirements & implementation status

Priority definitions:
- **P0:** Required to establish the core CMS.
- **P1:** Required for a reliable editorial experience shortly after the first vertical slice.
- **P2:** Expansion capability.

### 7.1 Identity and permissions

- **FR-001 (P0) [Implemented]:** Users can sign in (`/login`) and sign out using server-backed session cookies, plus switch demo roles with one click.
- **FR-002 (P0) [Implemented]:** Server-side authorization (`requireSession`, `hasPermission`, `canEditContent`) protects all private content and mutations.
- **FR-003 (P0) [Implemented]:** Site membership (`memberships` table) and roles (`owner`, `admin`, `editor`, `author`) determine access per site.
- **FR-004 (P1) [Implemented]:** Administrative changes and editorial mutations are recorded in `audit_logs` and surfaced on `/dashboard`.
- **FR-005 (P2) [Planned]:** Email invitation workflows and advanced organization administration.

### 7.2 Sites and settings

- **FR-010 (P0) [Implemented]:** Each site has a name, slug, domain, tagline, description, and default SEO configuration (`/settings`).
- **FR-011 (P0) [Implemented]:** Multi-site ownership and membership boundaries are enforced across `flagship` and `northwind-studio` workspaces with an active site switcher in the sidebar.
- **FR-012 (P1) [Implemented]:** Site settings define brand colors (`primaryColor`, `accentColor`, `backgroundColor`), typography (`system`, `serif`, `mono`), component radius, and default SEO metadata.
- **FR-013 (P2) [Planned]:** Advanced multisite provisioning and billing administration.

### 7.3 Pages and posts

- **FR-020 (P0) [Implemented]:** Authorized users can create, read, filter, update, and delete pages (`/pages`) and posts (`/posts`).
- **FR-021 (P0) [Implemented]:** Content supports `draft`, `published`, `scheduled`, and `archived` states, storing `published_document_json` separately from working `document_json`.
- **FR-022 (P0) [Implemented]:** Content enforces a unique slug within `(site_id, kind, slug)`.
- **FR-023 (P0) [Implemented]:** Public routes (`/s/[siteSlug]/...`) query only `status = 'published'` and render `published_document_json`; drafts return `404`.
- **FR-024 (P1) [Implemented]:** Content supports site-scoped categories and tags (`taxonomies` and `content_taxonomies`).
- **FR-025 (P1) [Implemented]:** Editors, Admins, and Owners can unpublish content back to `draft` without deleting it.
- **FR-026 (P1) [Planned]:** Automated background cron worker for scheduled publishing/unpublishing (`scheduled_for` column is provisioned in schema).
- **FR-027 (P1) [Implemented]:** Immutable numbered revision snapshots (`revisions` table) allow one-click recovery from earlier saved versions in the editor.
- **FR-028 (P1) [Implemented]:** Unsaved-change badge (`isDirty`) and automatic pre-publish save prevent accidental content loss.

### 7.4 Block editor and content schema

- **FR-030 (P0) [Implemented]:** Every page and post stores a structured `ContentDocument` with `schemaVersion: 1`.
- **FR-031 (P0) [Implemented]:** The editor supports 7 registered block types: `heading`, `paragraph`, `image`, `button`, `divider`, `callout`, and `columns`.
- **FR-032 (P0) [Implemented]:** Every block type is registered in `BLOCK_CATALOG` with runtime validation (`validateAndNormalizeBlock`) and a server-safe React renderer (`BlockDocumentRenderer`).
- **FR-033 (P0) [Implemented]:** Unregistered block types are rejected and URLs are sanitized via `sanitizeUrl` (blocking `javascript:`, `data:`, and `vbscript:` URIs).
- **FR-034 (P1) [Implemented]:** Users can reorder blocks (move up/down), duplicate blocks, delete blocks, and edit properties in the Block Inspector.
- **FR-035 (P1) [Implemented]:** Structured child items are validated within `columns` blocks.
- **FR-036 (P1) [Implemented]:** `validateAndMigrateDocument` normalizes older schema versions to `CURRENT_DOCUMENT_SCHEMA_VERSION`.
- **FR-037 (P2) [Planned]:** Reusable cross-page block patterns and saved section templates.

### 7.5 Preview and publishing

- **FR-040 (P0) [Implemented]:** Authorized site members can preview working drafts at `/preview/[id]` and inside the editor's responsive preview tab.
- **FR-041 (P0) [Implemented]:** `/preview/[id]` enforces server-side session and site-membership verification and sets `noindex, nofollow`.
- **FR-042 (P0) [Implemented]:** Publishing snapshots `document_json` into `published_document_json` and triggers Next.js `revalidatePath` across public routes.
- **FR-043 (P0) [Implemented]:** Unpublishing clears `published_document_json`, sets status to `draft`, and immediately invalidates public route caches.
- **FR-044 (P1) [Planned]:** Side-by-side visual diff view comparing working draft blocks against the live published snapshot.
- **FR-045 (P1) [Implemented]:** Publication status badges, timestamps, and revision counts are displayed in the dashboard and editor.

### 7.6 Media

- **FR-050 (P0) [Implemented]:** Users can register media metadata (`/media`) and bind assets to `image` blocks in the editor.
- **FR-051 (P1) [Planned]:** Direct binary multipart upload adapter for S3/R2 object storage.
- **FR-052 (P1) [Implemented]:** Media assets require `altText` for accessibility and support captions, MIME types, and dimensions.
- **FR-053 (P1) [Implemented]:** Server validation enforces a strict MIME allowlist (`image/svg+xml`, `image/png`, `image/jpeg`, `image/webp`, `image/gif`, `application/pdf`) and a 10 MB size cap.
- **FR-054 (P2) [Planned]:** Automated image resizing and responsive `srcset` generation.

### 7.7 Public rendering and SEO

- **FR-060 (P0) [Implemented]:** Published pages render at `/s/[siteSlug]` and `/s/[siteSlug]/[slug]`; published posts render at `/s/[siteSlug]/blog/[slug]`.
- **FR-061 (P0) [Implemented]:** Public layouts and navigation work responsively across mobile, tablet, and desktop viewports.
- **FR-062 (P0) [Implemented]:** Per-item and site-default `metaTitle`, `metaDescription`, `canonicalUrl`, `noIndex`, and OpenGraph metadata are emitted via Next.js `generateMetadata`.
- **FR-063 (P1) [Implemented]:** Dynamic `/sitemap.xml` (`src/app/sitemap.ts`) and `/robots.txt` (`src/app/robots.ts`) are generated from published site content.
- **FR-064 (P1) [Implemented]:** Public images render with `loading="lazy"`, aspect-ratio containers, and accessible `alt` attributes.
- **FR-065 (P1) [Implemented]:** Next.js cache revalidation (`revalidatePath`) is tied to content save, publish, unpublish, delete, and site settings mutations.
- **FR-066 (P2) [Planned]:** Public full-text search endpoint and 301/302 redirect manager.

### 7.8 Visual website builder (Phase 4)

- **FR-070 (P1) [Implemented]:** The responsive preview canvas renders the exact same `ContentDocument` used by the block editor.
- **FR-071 (P1) [Implemented]:** Users can add, select, reorder, duplicate, and configure registered blocks in the canvas/inspector.
- **FR-072 (P1) [Implemented]:** Desktop, Tablet (`768px`), and Mobile (`390px`) preview modes are built into the editor.
- **FR-073 (P1) [Implemented]:** Site-level `ThemeSettings` tokens control primary/accent/surface colors, heading typography, and border radius.
- **FR-074 (P1) [Planned]:** Reusable section library and starter page templates.
- **FR-075 (P1) [Implemented]:** Explicit keyboard-accessible Move Up / Move Down / Duplicate / Remove controls are provided on every block.
- **FR-076 (P2) [Planned]:** Drag-and-drop visual canvas manipulation and theme-level header/footer template editing.

### 7.9 Extensibility (Phase 5)

- **FR-080 (P2) [Planned]:** Custom content types and custom field schemas.
- **FR-081 (P2) [Planned]:** Versioned REST/GraphQL APIs and outbound webhooks.
- **FR-082 (P2) [Planned]:** Declarative extension manifest and permission boundaries.
- **FR-083 (P2) [Planned]:** JSON/Markdown site import and export cli/UI tools.
- **FR-084 (P2) [Planned]:** Isolated plugin execution model.

## 8. Non-functional requirements

### Security
- Server-side session verification and site-membership RBAC checks on every private read and Server Action mutation.
- Runtime schema validation (`validateAndMigrateDocument`) and URL sanitization (`sanitizeUrl`) on all block payloads.
- Explicit separation between `document_json` (draft) and `published_document_json` (public) to prevent draft leakage.
- Audit logging (`audit_logs`) for content creation, updates, publication changes, media registration, and settings updates.

### Performance
- Public routes (`/s/[siteSlug]/...`) use lightweight Server Components (`PublicSiteShell`, `BlockDocumentRenderer`) and never ship the interactive `BlockEditor` client bundle to public visitors.
- Scoped `text-wrap: balance` on headings and `text-wrap: pretty` on body copy without global `*` selector overhead.

### Accessibility
- Targets WCAG 2.2 AA: semantic landmarks, focusable scroll regions (`tabIndex={0}`, `role="region"`) for responsive tables, native `<dialog closedby="any">` modals with keyboard `Esc` and Safari backdrop fallbacks, required image `alt` attributes, and `@media (prefers-reduced-motion: reduce)` support.

### Reliability and maintainability
- Versioned SQL migrations (`schema_migrations`) and versioned content documents (`schemaVersion: 1`).
- Automated test suite (`npm test`) using isolated in-memory SQLite databases (`NEXTPRESS_DB_PATH=":memory:"`).

## 9. Implemented data model (`src/lib/db.ts`)

- **`users`:** `id`, `email`, `name`, `password_hash`, `avatar_initials`, `status`, `created_at`, `updated_at`
- **`sites`:** `id`, `name`, `slug`, `domain`, `tagline`, `description`, `owner_id`, `theme_settings_json`, `seo_defaults_json`, `created_at`, `updated_at`
- **`memberships`:** `id`, `site_id`, `user_id`, `role` (`owner` | `admin` | `editor` | `author`), `status`, `created_at`
- **`sessions`:** `token`, `user_id`, `active_site_id`, `expires_at`, `created_at`
- **`content_items`:** `id`, `site_id`, `kind` (`page` | `post`), `title`, `slug`, `excerpt`, `status`, `document_json`, `published_document_json`, `seo_json`, `author_id`, `published_at`, `scheduled_for`, `created_at`, `updated_at`
- **`taxonomies`:** `id`, `site_id`, `name`, `slug`, `type` (`category` | `tag`), `description`, `created_at`
- **`content_taxonomies`:** `content_id`, `taxonomy_id`
- **`media_assets`:** `id`, `site_id`, `filename`, `storage_key`, `url`, `mime_type`, `size_bytes`, `width`, `height`, `alt_text`, `caption`, `uploaded_by`, `created_at`
- **`revisions`:** `id`, `content_id`, `site_id`, `version`, `title`, `slug`, `document_json`, `seo_json`, `note`, `author_id`, `created_at`
- **`audit_logs`:** `id`, `site_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `details_json`, `created_at`

## 10. Milestones and status

### Milestone 0 — Audit (✅ Complete)
**Deliverables:** Repository inventory, test/build baseline fixes, feature status matrix (`docs/AUDIT-REPORT.md`).

### Milestone 1 — Core CMS (✅ Complete)
**Deliverables:** Authentication, 4-tier RBAC roles, multi-site boundary, pages & posts CRUD, draft/published states, media metadata registry, site settings.

### Milestone 2 — Publishable Vertical Slice (✅ Complete)
**Deliverables:** Versioned block document schema (`v1`), interactive block editor (`7` block types), protected private preview (`/preview/[id]`), public renderer (`/s/[siteSlug]/...`), slugs, SEO metadata, `sitemap.xml`, and `robots.txt`.

### Milestone 3 — Editorial Reliability (🟡 In Progress — Core Features Live)
**Deliverables:**
- ✅ Numbered revision history and one-click revision restore (`revisions` table + editor tab).
- ✅ Categories and tags taxonomy system (`taxonomies` + `content_taxonomies`).
- ✅ Media MIME type and size validation + required alt text.
- ✅ Accessibility enhancements (container-query responsive tables, light-dismiss dialogs, keyboard block ordering).
- ⏳ Remaining for Milestone 3: Binary file upload to S3-compatible object storage, background scheduled publishing worker, and side-by-side draft vs. published visual diff.

### Milestone 4 — Visual Builder (⏳ Next Phase)
**Deliverables:** Drag-and-drop canvas manipulation, saved section templates, starter page layouts, and header/footer template builder.

### Milestone 5 — Extensibility and Scale (⏳ Planned)
**Deliverables:** Custom content types/fields, public REST/webhook APIs, site import/export, and PostgreSQL production adapter.

## 11. Resolved & remaining open decisions

### Resolved decisions
- **Source of truth:** `main` branch of `Nextpress.js`.
- **Local & MVP persistence:** Built-in `node:sqlite` (`data/nextpress.sqlite`) for zero-dependency local reliability, with clean relational/JSON separation for future PostgreSQL migration.
- **Identity & RBAC:** Built-in HTTP-only session auth with pre-seeded `Owner`, `Admin`, `Editor`, and `Author` personas.
- **Multi-site support:** Supported from day one via site-scoped queries and the sidebar workspace switcher (`flagship` and `northwind-studio`).

### Remaining decisions for future milestones
- Which S3-compatible object storage provider (AWS S3, Cloudflare R2, Supabase Storage) should back binary media uploads in Milestone 3?
- Which transactional email provider should power member invitations in Milestone 5?
- What open-source or commercial license should be added before public distribution?
