# NextPress.js — Proposed Architecture

This document records a proposed architecture for comparison against the existing repository. It is not an instruction to replace existing code before an audit.

## 1. Architecture style

Start with a modular monolith. One Next.js application can host the admin, preview, public rendering, and API routes while domain modules remain separated by responsibility. This reduces deployment and operational complexity while allowing shared validation and rendering code.

## 2. Logical modules

- **Identity and access:** user identity, site membership, roles, authorization.
- **Sites:** site settings, domain and slug configuration, theme settings.
- **Content:** pages, posts, taxonomies, slugs, publication state.
- **Documents:** block schemas, document versioning, block registry, schema migrations.
- **Editor:** block editing experience and editor state.
- **Builder:** future canvas and visual layout controls.
- **Renderer:** server-safe React renderers for registered block types.
- **Media:** asset metadata, upload authorization, storage adapter.
- **Publishing:** draft/preview/publish/unpublish workflow and cache invalidation.
- **SEO:** metadata, canonical URLs, sitemap and robots configuration.
- **Extensions:** later APIs, hooks, webhooks and custom content types.

## 3. Request and publishing flow

1. The client submits an editor action.
2. The server authenticates the caller and authorizes the action for the target site and content.
3. Input is validated against the domain schema.
4. The application service performs the mutation.
5. Persistence records the update and, when appropriate, a revision.
6. Publishing updates the explicit published state and invalidates the relevant public route cache.
7. The public renderer loads published content only and resolves each block through the trusted registry.

Draft preview must use a protected path or preview mechanism and must not be made public merely by knowing a content ID or slug.

## 4. Content document contract

An initial logical contract:

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

Production requirements:
- Use a runtime validation schema for every block.
- Restrict allowed block types and nested child types.
- Define a renderer for each registered type.
- Sanitize rich text and URL properties.
- Avoid evaluating saved JavaScript or rendering arbitrary HTML without sanitization.
- Maintain migrations for document and block versions.
- Decide how invalid/unknown blocks are displayed and how users are notified.

## 5. Data persistence

PostgreSQL is a proposed default, not a mandatory migration target. Before selecting it, inspect the current repository and any deployed database.

Possible relational entities:
`User`, `Site`, `Membership`, `Page`, `Post`, `Taxonomy`, `MediaAsset`, `Revision`, `ThemeSettings`.

Store fields needed for filtering, authorization, indexing, and publishing in relational columns. A versioned JSON/JSONB document can store block content. Enforce site-scoped unique slugs and add indexes based on actual query patterns.

Use migrations and backups. Never reset a shared or production database as a convenience during development.

## 6. Authorization model

Every protected operation must check:
- Who is the authenticated user?
- Which site does the resource belong to?
- Is the user a member of that site?
- Does the user's role permit this operation?
- Is the resource in a state that permits the requested action?

Suggested initial roles:
- **Owner:** manages site and members.
- **Administrator:** manages site configuration and content.
- **Editor:** manages and publishes content if explicitly granted.
- **Author:** creates and edits permitted content; publishing rights may be limited.

Role names and exact permissions should be validated against product needs. Hiding a button is not authorization.

## 7. Media storage

Keep media metadata in the database and binary files in object storage. Use a storage adapter so the application does not depend directly on one vendor. Validate size, MIME type, extension, ownership, and upload permissions. Use generated storage keys rather than trusting user-supplied filenames. Define cleanup behavior for unreferenced assets.

## 8. Rendering and caching

Separate public page bundles from admin/editor bundles. Public rendering should load published data only, use safe block renderers, and provide metadata for search engines. Cache invalidation must be tied to publish, unpublish, slug changes, and relevant settings changes. Test the possibility of stale content and draft leakage.

## 9. Testing strategy

- Unit tests: schemas, slug rules, permissions, document migrations, publishing state.
- Integration tests: database mutations, media metadata, preview authorization, cache invalidation.
- End-to-end tests: sign-in, create/edit, preview, publish, public visit, unpublish.
- Security tests: cross-site access attempts, draft access, malformed blocks, unsafe URLs, upload validation.
- Accessibility tests: keyboard flows, focus, labels, contrast, reduced motion.
- Release checks: typecheck, lint, production build, migration validation, environment configuration.

## 10. Evolution path

Do not build a general plugin runtime before the core CMS is stable. Begin with documented internal module interfaces and a controlled registry. Later, add custom content types, public APIs, webhooks, and extension contracts with versioning and permissions. Arbitrary third-party server-code execution requires a separate threat model and should not be assumed safe.
