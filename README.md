# NextPress.js

**A modern, WordPress-inspired content management system and visual website builder built with Next.js.**

NextPress.js is intended to serve both people building their own websites and teams delivering websites for clients. The product will begin with dependable CMS fundamentals and grow toward a combined block editor and visual website builder.

> **Starter status:** This ZIP is a clean starter scaffold, not a completed CMS. Authentication, persistence, uploads, revisions, scheduling, and the full editor are not implemented yet. The dashboard is a front-end starting point using sample data. Do not use it for production content until the security and persistence layers are implemented and tested.

## Product principles

1. **Audit before replacing.** This starter is intended to help establish a repository. If an existing NextPress repository already contains working functionality, audit it first and selectively port or merge these ideas instead of overwriting it.
2. **One content model.** The block editor and future visual builder must operate on the same validated, versioned document format.
3. **Core CMS first.** Pages, posts, media, access control, drafts, previews, publishing, and rendering precede advanced extensions.
4. **Secure by default.** Server-side authorization, validated inputs, controlled block rendering, and explicit publication states are required.
5. **Accessible, responsive UI.** Keyboard use, focus states, contrast, reduced motion, and mobile layouts are first-class requirements.
6. **Incremental architecture.** Start as a modular Next.js application. Split packages or services only when there is a demonstrated reason.

## Included in this starter

- Next.js App Router + React + TypeScript.
- Tailwind CSS with a small NextPress design-token palette.
- A responsive starter dashboard with navigation and overview metrics.
- Placeholder routes for pages, posts, media, and settings.
- A public landing page explaining the product.
- An illustrative shared content document type.
- Architecture and product requirements in `PRD.md`.
- Environment variable template and `.gitignore`.

## Not implemented yet

- Authentication or user accounts.
- Database connection, schema, migrations, or seed scripts.
- Real create/update/delete APIs.
- Media uploads or object storage.
- Draft persistence, revision history, scheduling, or publishing.
- A functional block editor or visual canvas.
- Site tenancy, extension APIs, comments, forms, or custom post types.
- Production security review or deployment verification.

## Requirements

- Node.js 20 or newer.
- npm 10 or compatible npm.
- Git.

Check versions:

```bash
node --version
npm --version
git --version
```

## Run locally

1. Extract the ZIP.
2. Open a terminal in the `nextpress` directory.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy the environment template if you want to prepare local configuration:

   ```bash
   cp .env.example .env.local
   ```

   No environment variables are required to render the current scaffold.

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Visit [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
npm run dev       # Start the local development server
npm run build     # Create a production build
npm run start     # Run a previously built app
npm run typecheck # Run TypeScript checks
```

The starter includes an ESLint flat configuration using the Next.js Core Web Vitals and TypeScript rules. If you change the Next.js major version, review the matching ESLint configuration and run `npm run lint`.

## Project structure

```text
nextpress/
├── docs/
│   └── ARCHITECTURE.md
├── public/
│   └── nextpress-mark.svg
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/
│   │   │   ├── pages/
│   │   │   ├── posts/
│   │   │   ├── media/
│   │   │   └── settings/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── dashboard-shell.tsx
│   │   └── sidebar-nav.tsx
│   └── lib/
│       ├── content-types.ts
│       └── utils.ts
├── .env.example
├── PRD.md
├── README.md
└── package.json
```

## Architecture direction

### Application shape

Keep the first version as a modular monolith:

- **Presentation:** App Router pages and reusable UI components.
- **Domain:** content, publishing, sites, memberships, media, and permissions.
- **Persistence:** PostgreSQL plus migrations, after confirming the existing project has no database to preserve.
- **Identity:** Auth.js or a suitable managed identity provider, chosen after comparing deployment needs.
- **File storage:** S3-compatible object storage; store file metadata in the database and binary objects in storage.
- **Rendering:** a controlled registry maps validated block types to React renderers.
- **Testing:** unit and integration tests for domain logic; end-to-end tests for publishing and authorization.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the proposed module boundaries and data model.

### Content document

The editor should save structured content, not arbitrary executable code. An illustrative starting point:

```ts
type ContentDocument = {
  schemaVersion: number;
  blocks: ContentBlock[];
};

type ContentBlock = {
  id: string;
  type: string;
  version: number;
  props: Record<string, unknown>;
  children?: ContentBlock[];
};
```

Before production use, replace the broad `Record<string, unknown>` with validated schemas for each registered block. Persist the schema version and define migrations when document structures change. Never use `eval` or execute arbitrary saved JavaScript to render content.

### Proposed database entities

- `User`
- `Site`
- `Membership`
- `Page`
- `Post`
- `Taxonomy`
- `MediaAsset`
- `Revision`
- `ThemeSettings`

These are proposals, not a claim that the schema already exists. If adopting this scaffold into an existing repository, compare these entities against the current schema before adding anything.

## Development roadmap

### Phase 0 — Audit and baseline
- Inspect the existing repository, branches, dependencies, build, tests, data model, and deployment.
- Classify existing functionality as working, partial, broken, missing, or unverified.
- Record the current commit and preserve a rollback path.
- Decide what to retain, refactor, replace, or port.

### Phase 1 — CMS foundation
- Authentication, roles, site membership, and server-side authorization.
- PostgreSQL schema and safe migrations.
- Dashboard and content CRUD.
- Pages, posts, taxonomies, and media metadata.
- Draft and published states.

### Phase 2 — Publishing
- Shared block schema and registry.
- Basic block editor and public renderer.
- Preview access, slugs, SEO metadata, and cache invalidation.
- Revisions, autosave, and recovery.

### Phase 3 — Editorial completeness
- Media uploads, alt text, and storage policies.
- Scheduling, categories/tags, search, and import/export.
- Accessibility, error handling, and comprehensive tests.

### Phase 4 — Visual builder
- Drag-and-drop canvas and component palette.
- Reusable sections and templates.
- Global design tokens and responsive controls.
- Visual preview driven by the same content model.

### Phase 5 — Extensibility
- Custom content types and fields.
- Public APIs, webhooks, and documented extension contracts.
- Optional multi-site operations and multi-tenancy.
- Performance, backup/restore, audit logs, and operational monitoring.

## Quality gates

Before calling a feature complete:

- The main flow works in a browser, not just in code.
- Type checks and production build pass.
- Inputs are validated on the server.
- Authorization is checked server-side for each protected operation.
- Draft content cannot leak through public routes or caches.
- UI works with keyboard navigation and reduced-motion preferences.
- Tests cover normal, invalid, unauthorized, and failure cases.
- Configuration and migrations are documented.

## Design engineering resources

Use these as review references, not as substitutes for implementation and testing:

- [Taste-Skill](https://github.com/leonxlnx/taste-skill): art direction, layout, typography, spacing, and visual QA.
- [Emil Kowalski's Design Engineering skill](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md): motion timing, easing, interaction feedback, loading states, and animation restraint.
- [shadcn/ui](https://ui.shadcn.com/): accessible component foundations that should be customized to the NextPress design system.

## Contribution workflow

1. Create a feature branch.
2. Read `PRD.md` and `docs/ARCHITECTURE.md`.
3. Write or update acceptance criteria before implementing a feature.
4. Keep changes small and avoid unrelated refactors.
5. Run `npm run typecheck` and `npm run build`.
6. Add tests as the persistence and domain layers are introduced.
7. Document environment variables, migrations, and known limitations in the same change.

## Security warning

This starter has no authentication or persistence. Do not deploy it as a real CMS, upload private media, or place production secrets in source control. Before production, implement and test authentication, authorization, CSRF protections where applicable, rate limiting, input validation, upload restrictions, secure headers, backups, and secret management.

## License

No license is specified. Add a `LICENSE` file before distributing the project publicly or accepting external contributions.
# Nextpress.js
