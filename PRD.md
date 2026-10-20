# NextPress.js — Product Requirements Document (PRD)

- **Document status:** Initial proposal for development planning
- **Version:** 0.1
- **Product name:** NextPress.js
- **Primary platform:** Responsive web application
- **Initial delivery strategy:** Core CMS first; visual builder and extensibility follow
- **Important caveat:** Requirements must be reconciled with the existing repository audit before implementation decisions become binding.

## 1. Executive summary

NextPress.js is a modern content management system inspired by the practical strengths of WordPress, built with Next.js and React. It will support people creating their own websites and teams building websites for clients. It should begin with reliable content management and publishing, then grow into a unified block editor and visual website builder.

The product is not simply a WordPress theme or a React skin over WordPress. It is a CMS application with its own content model, editorial workflow, rendering system, permissions, and eventual extension contracts.

## 2. Problem statement

Website owners and teams need a dependable way to create, organize, preview, publish, and maintain websites without manually coding every page. They also need room to control layout and brand presentation. A CMS that focuses only on publishing can feel restrictive; a builder that focuses only on canvas editing can create inconsistent data and difficult-to-maintain pages.

NextPress.js will address this by combining a structured content system with progressive visual editing, using a single canonical content format.

## 3. Vision

Make it possible for a user to move from an empty site to a well-structured, publishable website through a dependable CMS workflow, then use visual tools to customize the site without fragmenting content or sacrificing performance, accessibility, or maintainability.

## 4. Product decisions

### Confirmed direction

- **Audience:** Both personal website owners and people/teams creating client websites, with potential to serve more users over time.
- **Editing:** Support block editing and visual building.
- **Scope:** Build core WordPress-style CMS functionality first, then expand.
- **Repository policy:** Audit the existing repository before deciding on destructive replacement or major refactoring.
- **Technology direction:** Next.js, React, TypeScript, Tailwind CSS, and shadcn/ui are the preferred starting stack, subject to repository audit.
- **Design quality:** Apply Taste-Skill for visual design review and Emil Kowalski's design engineering guidance for motion and interaction details.

### Proposed assumptions to validate

- Initial release is a responsive web app.
- The first release is a modular monolith rather than microservices.
- PostgreSQL is the preferred relational database if the existing project does not already use a viable database.
- The first editor is block-based; a full visual canvas follows once the shared content schema and renderer are stable.
- Multi-tenancy, third-party plugins, comments, and advanced custom content types are not MVP requirements.

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

### Persona C — Content editor

**Goal:** Write and publish content while staying within assigned permissions.

Needs:
- Drafting, editing, categorization, previews, and scheduled publication.
- Accessible editing controls.
- Confidence that unpublished content is not publicly visible.

### Persona D — Future platform developer

**Goal:** Extend NextPress after the core product stabilizes.

Needs:
- Documented APIs and stable extension points.
- Validated content types and schemas.
- Clear compatibility and migration policies.

This persona is relevant to later phases, not a reason to delay the CMS MVP.

## 6. Goals and non-goals

### MVP goals

1. Users can authenticate and access only the sites and operations allowed by their role.
2. Authorized users can create, edit, preview, publish, and unpublish pages and posts.
3. Content survives reloads and ordinary application restarts.
4. Public routes render published content responsively.
5. Media metadata and assets can be managed safely.
6. Basic SEO metadata can be configured.
7. The first block-based editor and public renderer share one versioned content model.
8. Critical workflows have automated tests and documented operational setup.

### Non-goals for MVP

- Complete parity with every WordPress feature.
- Running existing PHP WordPress plugins directly.
- A complete third-party plugin marketplace.
- Full visual canvas with arbitrary positioning.
- E-commerce, memberships, comments, or form automation unless added to the approved scope.
- Native mobile apps.
- Microservices without a demonstrated scaling or team need.
- Claiming production readiness before security and operational validation.

## 7. Functional requirements

Priority definitions:
- **P0:** Required to establish the core CMS.
- **P1:** Required for a reliable editorial experience shortly after the first vertical slice.
- **P2:** Expansion capability.

### 7.1 Identity and permissions

- **FR-001 (P0):** Users can sign in and sign out using the selected identity solution.
- **FR-002 (P0):** Server-side authorization protects all private content and mutations.
- **FR-003 (P0):** Site membership and roles determine access.
- **FR-004 (P1):** Administrative changes and sensitive actions can be audited.
- **FR-005 (P2):** Invitation workflows and advanced organization administration may be added.

### 7.2 Sites and settings

- **FR-010 (P0):** A site has a name, URL/slug configuration, and basic settings.
- **FR-011 (P0):** The system has a clear site ownership and membership boundary, even if only one site is initially exposed in the UI.
- **FR-012 (P1):** Site settings can define brand colors, typography, and default metadata.
- **FR-013 (P2):** Advanced multisite administration may be added after tenancy and billing decisions.

### 7.3 Pages and posts

- **FR-020 (P0):** Authorized users can create, read, update, and delete pages and posts.
- **FR-021 (P0):** Content supports draft and published states.
- **FR-022 (P0):** Content supports a unique slug within its appropriate site/content namespace.
- **FR-023 (P0):** Public routes only expose content that is published and intended for public access.
- **FR-024 (P1):** Content supports categories and tags or an equivalent taxonomy system.
- **FR-025 (P1):** Users can unpublish content without deleting it.
- **FR-026 (P1):** Scheduled publishing and unpublishing are supported.
- **FR-027 (P1):** Revision history allows recovery from an earlier saved version.
- **FR-028 (P1):** Autosave and unsaved-change feedback reduce accidental content loss.

### 7.4 Block editor and content schema

- **FR-030 (P0):** A page or post stores a structured document with a schema version.
- **FR-031 (P0):** The editor supports a minimum block set: heading, paragraph, image, button/link, and spacer/divider.
- **FR-032 (P0):** Every block type is registered with a validated schema and a safe renderer.
- **FR-033 (P0):** Invalid block data is rejected or safely handled; it cannot execute arbitrary code.
- **FR-034 (P1):** Users can reorder blocks and edit block properties.
- **FR-035 (P1):** The system supports nested blocks only where the block schema explicitly permits them.
- **FR-036 (P1):** Schema migrations preserve or explicitly report older content.
- **FR-037 (P2):** Reusable block patterns and saved sections can be introduced.

### 7.5 Preview and publishing

- **FR-040 (P0):** An authorized editor can preview a draft before publication.
- **FR-041 (P0):** Preview access is protected and does not expose drafts to unauthenticated users.
- **FR-042 (P0):** Publishing updates the public page and invalidates relevant caches.
- **FR-043 (P0):** Unpublishing removes content from public access within a documented cache-invalidation window.
- **FR-044 (P1):** A user can compare a draft with the published version.
- **FR-045 (P1):** Publication status and timestamps are visible in the dashboard.

### 7.6 Media

- **FR-050 (P0):** Users can register media metadata and associate assets with content.
- **FR-051 (P1):** Users can upload permitted file types to controlled object storage.
- **FR-052 (P1):** Images support alt text and useful metadata.
- **FR-053 (P1):** Uploads enforce size/type limits and use safe storage permissions.
- **FR-054 (P2):** Image transformations, responsive variants, and advanced media search may be added.

### 7.7 Public rendering and SEO

- **FR-060 (P0):** Published pages render on stable public URLs.
- **FR-061 (P0):** Public layouts work at mobile, tablet, and desktop widths.
- **FR-062 (P0):** Page titles, descriptions, canonical URLs, and social metadata can be configured.
- **FR-063 (P1):** Sitemap and robots directives are generated appropriately.
- **FR-064 (P1):** Images use suitable dimensions and loading behavior.
- **FR-065 (P1):** Cache invalidation is tied to content publication changes.
- **FR-066 (P2):** Search, redirects management, and richer SEO tooling may follow.

### 7.8 Visual website builder

- **FR-070 (P1, after CMS foundation):** A canvas can render the same document format used by the block editor.
- **FR-071 (P1):** Users can add, select, reorder, and configure registered blocks.
- **FR-072 (P1):** The builder supports desktop, tablet, and mobile preview modes.
- **FR-073 (P1):** Shared design tokens control typography, colors, spacing, and common styles.
- **FR-074 (P1):** Reusable sections and templates can be saved and applied.
- **FR-075 (P1):** Keyboard alternatives exist for important drag-and-drop actions.
- **FR-076 (P2):** Advanced layout primitives and theme-level template editing can be added.

### 7.9 Extensibility

- **FR-080 (P2):** Custom content types and fields use explicit schemas.
- **FR-081 (P2):** APIs and webhooks are documented, versioned, and access-controlled.
- **FR-082 (P2):** Extensions have defined permissions and compatibility boundaries.
- **FR-083 (P2):** Import/export supports documented formats and safe validation.
- **FR-084 (P2):** Plugin execution must not permit arbitrary server code to run without a deliberate, isolated security design.

## 8. Non-functional requirements

### Security
- Use established authentication primitives.
- Authorize on the server for every private read and mutation.
- Validate input at API/server-action boundaries.
- Sanitize rich text and restrict block renderers to known types.
- Protect preview and draft content.
- Apply safe upload policies and never commit credentials.
- Plan rate limiting, secure headers, backup/restore, and audit logging before production.

### Performance
- Keep public rendering separate from editor-only JavaScript where practical.
- Avoid shipping the full editor bundle to public visitors.
- Use image optimization and cache published content safely.
- Measure page performance on low-powered mobile devices.
- Establish budgets from measurements rather than arbitrary claims.

### Accessibility
- Target WCAG 2.2 AA as the design and test objective.
- Support keyboard navigation and visible focus.
- Use semantic HTML and accessible names.
- Honor `prefers-reduced-motion`.
- Provide keyboard alternatives to drag-and-drop.

### Reliability and maintainability
- Use versioned migrations for both database and content schemas.
- Add automated tests for publishing, permissions, and cache behavior.
- Define backup and recovery procedures before production use.
- Document environment configuration and operational procedures.

## 9. Core user journeys

### Journey A — Publish a page

1. User signs in.
2. User selects a site.
3. User creates a page.
4. User adds and edits blocks.
5. User saves a draft.
6. User previews the page privately.
7. User publishes the page.
8. Public URL displays the published content.
9. User edits and republishes; the public cache is updated.

### Journey B — Recover an edit

1. User changes existing content.
2. Autosave/revision creates a recoverable version.
3. User detects an unwanted change.
4. User previews or restores the earlier version.
5. The system records the resulting update and preserves a clear publication state.

### Journey C — Build a layout

1. User opens the visual builder for a page.
2. User adds a registered block to the canvas.
3. User changes block properties and layout settings.
4. User previews responsive breakpoints.
5. The builder saves the same canonical content document.
6. The public renderer displays the saved page consistently.

## 10. Suggested data model

This is a logical model, not a finalized database schema:

- **User:** identity, status, timestamps.
- **Site:** name, slug/domain settings, owner reference, settings.
- **Membership:** site, user, role, status.
- **Page:** site, title, slug, status, content document, SEO fields, timestamps.
- **Post:** site, title, slug, status, content document, taxonomy links, publication timestamps.
- **Taxonomy:** site, name, slug, type.
- **MediaAsset:** site, storage key, MIME type, size, alt text, metadata.
- **Revision:** content entity reference, version, content snapshot, author, timestamp.
- **ThemeSettings:** site, versioned design tokens and template configuration.

The actual schema must be reconciled with the repository audit. Prefer relational columns for queryable business fields and JSON/JSONB for versioned block documents when appropriate. Add indexes and constraints for site-scoped slugs and common publishing queries.

## 11. Architecture constraints and decisions

1. Use a modular monolith until independent deployment or scaling requirements justify services.
2. Keep editing UI and public rendering as separate experiences over one shared content schema.
3. Use a block registry; do not render arbitrary user-provided code.
4. Keep domain logic out of visual components where practical.
5. Enforce authorization server-side.
6. Make draft/preview/published states explicit.
7. Preserve current repository behavior until the audit identifies an approved change.
8. Treat existing data migrations and rollback as release requirements.
9. Do not promise compatibility with PHP WordPress plugins; NextPress will require its own extension model.
10. Keep advanced multi-tenancy and extension execution out of the MVP unless the audit or user requirements show they are necessary.

## 12. Milestones and acceptance criteria

### Milestone 0 — Audit
**Deliverables:** repository inventory, test/build baseline, feature status matrix, architecture comparison, migration and risk plan.

**Acceptance:** no destructive changes have been made; current behavior and unverified areas are documented.

### Milestone 1 — Core CMS
**Deliverables:** authentication, roles, site boundary, content CRUD, draft/published states, media metadata.

**Acceptance:** authorized users can manage content; unauthorized requests are denied; data persists.

### Milestone 2 — Publishable vertical slice
**Deliverables:** block document schema, editor for basic blocks, private preview, public renderer, slugs and SEO basics.

**Acceptance:** create → edit → preview → publish → visit public URL works end-to-end in automated and manual tests.

### Milestone 3 — Editorial reliability
**Deliverables:** revisions, autosave, scheduling, media uploads, taxonomies, accessibility fixes.

**Acceptance:** users can recover content; upload limits are enforced; publishing and unpublishing behave predictably.

### Milestone 4 — Visual builder
**Deliverables:** canvas, block selection and ordering, responsive previews, design tokens, templates.

**Acceptance:** a user can build different page layouts without custom code and without creating a separate incompatible content representation.

### Milestone 5 — Extensibility and scale
**Deliverables:** custom content types/fields, APIs, webhooks, import/export, operational monitoring, optional tenancy.

**Acceptance:** extension boundaries are documented, permissions are enforced, and compatibility tests cover public contracts.

## 13. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Replacing existing code prematurely | Lost functionality or data | Audit, branch, baseline, incremental migration |
| Separate editor and builder data formats | Duplicate features and inconsistent rendering | Shared versioned document and renderer |
| Unsafe saved block content | XSS or code execution | Per-block schemas, sanitization, controlled renderer |
| Draft leakage through caches | Confidential content exposed | Protected previews, explicit publication state, cache tests |
| Overbuilding WordPress parity | Delayed useful release | Prioritize the first vertical slice and stage extensions |
| Visual builder complexity | Schedule and maintenance burden | Build after schema, editor, and renderer stabilize |
| Media upload abuse | Security and storage cost | Type/size limits, authorization, controlled object storage |
| Multi-tenant access bugs | Cross-site data exposure | Site-scoped queries, authorization tests, tenant isolation |
| Poor mobile performance | Reduced usability | Measure on low-powered devices; isolate editor bundles |
| Tooling/dependency mismatch | Build failures | Audit versions and verify a clean install/build |

## 14. Analytics and success measures

Do not invent baseline values. Instrument and establish baselines before setting numeric targets.

Suggested measures:
- Time from creating a page to first publication.
- Percentage of publishing attempts that succeed.
- Content save failure rate.
- Preview-to-publish completion rate.
- Incidents of unauthorized access or draft leakage.
- Public page performance and accessibility results.
- Revision recovery success rate.
- Editor usability feedback from personal-site and client-site workflows.

## 15. Open decisions

Resolve these when needed, without blocking the first repository audit:

- Which repository and branch are the source of truth?
- Is there an existing database and authentication system to retain?
- Will the first deployment serve one site or multiple independent sites?
- Which identity provider and database are already configured?
- Which object storage and email provider should be used?
- Is scheduling required in the first release?
- Which content types beyond pages and posts are needed for the first launch?
- What deployment, budget, uptime, and backup constraints apply?
- What is the desired licensing and contribution model?

## 16. Definition of MVP complete

The MVP is complete only when an authorized user can sign in, create and edit a page with registered blocks, save and recover content, privately preview a draft, publish and unpublish safely, and serve the public page responsively with basic SEO metadata. Permissions, persistence, cache behavior, and the production build must be tested. A polished dashboard without a working publishing pipeline does not qualify.
