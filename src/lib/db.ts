import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  normalizeSlug,
  validateAndMigrateDocument,
  validateSeoMetadata,
  type ContentDocument,
  type ContentItemRecord,
  type ContentKind,
  type ContentStatus,
  type ContentSummary,
  type MediaAssetRecord,
  type RevisionRecord,
  type SeoMetadata,
  type SiteRecord,
  type SiteRole,
  type TaxonomyRecord,
  type ThemeSettings
} from "@/lib/content-types";
import { canEditContent, hasPermission } from "@/lib/permissions";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  avatarInitials: string;
  status: string;
};

export type SiteMembershipInfo = {
  site: SiteRecord;
  role: SiteRole;
};

export type SessionContext = {
  token: string;
  user: UserRecord;
  activeSite: SiteRecord;
  role: SiteRole;
  memberships: SiteMembershipInfo[];
};

export type AuditLogRecord = {
  id: string;
  siteId: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
};

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(`nextpress_salt_v1:${password}`).digest("hex");
}

function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

declare global {
  var __nextpressDb: DatabaseSync | undefined;
  var __nextpressDbPath: string | undefined;
}

export function getDb(): DatabaseSync {
  const targetPath =
    process.env.NEXTPRESS_DB_PATH || path.join(process.cwd(), "data", "nextpress.sqlite");

  if (globalThis.__nextpressDb && globalThis.__nextpressDbPath === targetPath) {
    return globalThis.__nextpressDb;
  }

  if (targetPath !== ":memory:") {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const db = new DatabaseSync(targetPath);
  db.exec("PRAGMA foreign_keys = ON;");
  if (targetPath !== ":memory:") {
    db.exec("PRAGMA journal_mode = WAL;");
  }

  runMigrations(db);
  seedDatabaseIfNeeded(db);

  globalThis.__nextpressDb = db;
  globalThis.__nextpressDbPath = targetPath;
  return db;
}

export function resetDbForTests(): void {
  if (globalThis.__nextpressDb) {
    try {
      globalThis.__nextpressDb.close();
    } catch {
      // ignore close errors
    }
  }
  globalThis.__nextpressDb = undefined;
  globalThis.__nextpressDbPath = undefined;
}

function runMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = db
    .prepare("SELECT version FROM schema_migrations WHERE version = 1")
    .get() as { version: number } | undefined;

  if (!applied) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_initials TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sites (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        domain TEXT,
        tagline TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        owner_id TEXT NOT NULL,
        theme_settings_json TEXT NOT NULL,
        seo_defaults_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS memberships (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('owner', 'admin', 'editor', 'author')),
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        UNIQUE(site_id, user_id),
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        active_site_id TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (active_site_id) REFERENCES sites(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS content_items (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('page', 'post')),
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        excerpt TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL CHECK(status IN ('draft', 'published', 'scheduled', 'archived')),
        document_json TEXT NOT NULL,
        published_document_json TEXT,
        seo_json TEXT NOT NULL,
        author_id TEXT NOT NULL,
        published_at TEXT,
        scheduled_for TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(site_id, kind, slug),
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_content_site_kind_status
        ON content_items(site_id, kind, status);

      CREATE TABLE IF NOT EXISTS taxonomies (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('category', 'tag')),
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        UNIQUE(site_id, type, slug),
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS content_taxonomies (
        content_id TEXT NOT NULL,
        taxonomy_id TEXT NOT NULL,
        PRIMARY KEY (content_id, taxonomy_id),
        FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
        FOREIGN KEY (taxonomy_id) REFERENCES taxonomies(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS media_assets (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        storage_key TEXT NOT NULL,
        url TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        width INTEGER,
        height INTEGER,
        alt_text TEXT NOT NULL DEFAULT '',
        caption TEXT NOT NULL DEFAULT '',
        uploaded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS revisions (
        id TEXT PRIMARY KEY,
        content_id TEXT NOT NULL,
        site_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        title TEXT NOT NULL,
        slug TEXT NOT NULL,
        document_json TEXT NOT NULL,
        seo_json TEXT NOT NULL,
        note TEXT NOT NULL DEFAULT '',
        author_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (content_id) REFERENCES content_items(id) ON DELETE CASCADE,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        site_id TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        details_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL,
        FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id)
      );
    `);

    db.prepare(
      "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)"
    ).run(1, "001_initial_cms_core", new Date().toISOString());
  }
}

function seedDatabaseIfNeeded(db: DatabaseSync): void {
  const row = db.prepare("SELECT COUNT(*) as cnt FROM users").get() as { cnt: number };
  if (row.cnt > 0) return;

  const now = new Date().toISOString();
  const defaultPasswordHash = hashPassword("nextpress123");

  // 1. Seed Users (Owner, Admin, Editor, Author)
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, password_hash, avatar_initials, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', ?, ?)
  `);

  insertUser.run("usr_owner", "ada@nextpress.dev", "Ada Lovelace", defaultPasswordHash, "AL", now, now);
  insertUser.run("usr_admin", "alex@nextpress.dev", "Alex Rivera", defaultPasswordHash, "AR", now, now);
  insertUser.run("usr_editor", "elena@nextpress.dev", "Elena Rostova", defaultPasswordHash, "ER", now, now);
  insertUser.run("usr_author", "marcus@nextpress.dev", "Marcus Vance", defaultPasswordHash, "MV", now, now);

  // 2. Seed Sites
  const defaultTheme: ThemeSettings = {
    primaryColor: "#176B4D",
    accentColor: "#8A5A20",
    backgroundColor: "#F6F7F4",
    headingFont: "system",
    bodyFont: "system",
    borderRadius: "rounded"
  };

  const clientTheme: ThemeSettings = {
    primaryColor: "#1E3A8A",
    accentColor: "#0D9488",
    backgroundColor: "#F8FAFC",
    headingFont: "serif",
    bodyFont: "system",
    borderRadius: "pill"
  };

  const insertSite = db.prepare(`
    INSERT INTO sites (id, name, slug, domain, tagline, description, owner_id, theme_settings_json, seo_defaults_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSite.run(
    "site_flagship",
    "NextPress Flagship",
    "flagship",
    "nextpress.local",
    "Publish with clarity. Build without limits.",
    "The official flagship publication and documentation site powered by NextPress.js.",
    "usr_owner",
    JSON.stringify(defaultTheme),
    JSON.stringify({
      metaTitle: "NextPress Flagship",
      metaDescription: "Modern structured publishing and visual site building with Next.js.",
      canonicalUrl: "http://localhost:3000/s/flagship",
      noIndex: false
    }),
    now,
    now
  );

  insertSite.run(
    "site_northwind",
    "Northwind Design Studio",
    "northwind-studio",
    "northwind.local",
    "Digital products & brand systems for ambitious teams.",
    "Client portfolio and agency workspace managed in NextPress.js.",
    "usr_owner",
    JSON.stringify(clientTheme),
    JSON.stringify({
      metaTitle: "Northwind Design Studio",
      metaDescription: "Independent design & engineering studio.",
      canonicalUrl: "http://localhost:3000/s/northwind-studio",
      noIndex: false
    }),
    now,
    now
  );

  // 3. Seed Memberships
  const insertMembership = db.prepare(`
    INSERT INTO memberships (id, site_id, user_id, role, status, created_at)
    VALUES (?, ?, ?, ?, 'active', ?)
  `);

  insertMembership.run("mem_1", "site_flagship", "usr_owner", "owner", now);
  insertMembership.run("mem_2", "site_flagship", "usr_admin", "admin", now);
  insertMembership.run("mem_3", "site_flagship", "usr_editor", "editor", now);
  insertMembership.run("mem_4", "site_flagship", "usr_author", "author", now);

  insertMembership.run("mem_5", "site_northwind", "usr_owner", "owner", now);
  insertMembership.run("mem_6", "site_northwind", "usr_editor", "editor", now);

  // 4. Seed Taxonomies
  const insertTax = db.prepare(`
    INSERT INTO taxonomies (id, site_id, name, slug, type, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTax.run("tax_prod", "site_flagship", "Product", "product", "category", "Product updates and roadmap", now);
  insertTax.run("tax_eng", "site_flagship", "Engineering", "engineering", "category", "Architecture and schema design", now);
  insertTax.run("tax_des", "site_flagship", "Design Systems", "design-systems", "category", "Typography, tokens, and visual QA", now);
  insertTax.run("tax_tag_cms", "site_flagship", "CMS", "cms", "tag", "Content management topics", now);
  insertTax.run("tax_tag_blocks", "site_flagship", "Block Editor", "block-editor", "tag", "Structured block editing", now);

  // 5. Seed Media Assets
  const insertMedia = db.prepare(`
    INSERT INTO media_assets (id, site_id, filename, storage_key, url, mime_type, size_bytes, width, height, alt_text, caption, uploaded_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMedia.run(
    "med_brand_mark",
    "site_flagship",
    "nextpress-mark.svg",
    "flagship/nextpress-mark.svg",
    "/nextpress-mark.svg",
    "image/svg+xml",
    1240,
    512,
    512,
    "NextPress.js geometric brand mark in forest green",
    "Official NextPress.js vector emblem",
    "usr_owner",
    now
  );

  // 6. Seed Pages & Posts with canonical ContentDocument blocks
  const homeDoc: ContentDocument = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    blocks: [
      {
        id: "blk_home_h1",
        type: "heading",
        version: 1,
        props: {
          text: "Publish with clarity. Build without limits.",
          level: 1,
          align: "left"
        }
      },
      {
        id: "blk_home_p1",
        type: "paragraph",
        version: 1,
        props: {
          text: "NextPress.js combines a structured editorial workflow with a validated block registry so personal sites and client teams can publish confidently without fragmenting their content model.",
          align: "left",
          lead: true
        }
      },
      {
        id: "blk_home_btn",
        type: "button",
        version: 1,
        props: {
          label: "Read our architecture guide",
          href: "/s/flagship/about",
          variant: "primary",
          align: "left"
        }
      },
      {
        id: "blk_home_div",
        type: "divider",
        version: 1,
        props: { style: "line", spacing: "md" }
      },
      {
        id: "blk_home_cols",
        type: "columns",
        version: 1,
        props: {
          columns: 3,
          items: [
            {
              title: "One canonical schema",
              body: "Both the block editor and future visual canvas operate on the same versioned JSON document."
            },
            {
              title: "Role-based guardrails",
              body: "Server-enforced permissions distinguish Owners, Administrators, Editors, and Authors."
            },
            {
              title: "Zero draft leakage",
              body: "Public routes serve only published snapshots while editors preview drafts privately."
            }
          ]
        }
      },
      {
        id: "blk_home_callout",
        type: "callout",
        version: 1,
        props: {
          title: "Live from SQLite persistence",
          text: "This page is rendered dynamically from the NextPress.js block registry. Edit its blocks in the dashboard and republish to see instant updates.",
          tone: "brand"
        }
      }
    ]
  };

  const aboutDoc: ContentDocument = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    blocks: [
      {
        id: "blk_about_h1",
        type: "heading",
        version: 1,
        props: { text: "Why we built NextPress.js", level: 1, align: "left" }
      },
      {
        id: "blk_about_p1",
        type: "paragraph",
        version: 1,
        props: {
          text: "Traditional CMS platforms often force a choice between rigid form fields and fragile visual page builders. NextPress.js bridges that divide with validated, versioned blocks.",
          align: "left",
          lead: true
        }
      },
      {
        id: "blk_about_img",
        type: "image",
        version: 1,
        props: {
          url: "/nextpress-mark.svg",
          alt: "NextPress emblem",
          caption: "Designed for long-term maintainability and clean public HTML.",
          aspectRatio: "16:9",
          mediaId: "med_brand_mark"
        }
      }
    ]
  };

  const draftPageDoc: ContentDocument = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    blocks: [
      {
        id: "blk_story_h1",
        type: "heading",
        version: 1,
        props: { text: "2026 Editorial & Visual Builder Roadmap", level: 1, align: "left" }
      },
      {
        id: "blk_story_p1",
        type: "paragraph",
        version: 1,
        props: {
          text: "This page is currently in Draft status. It can be previewed privately by authenticated site members, but visiting its public URL returns a 404 until published.",
          align: "left",
          lead: true
        }
      },
      {
        id: "blk_story_callout",
        type: "callout",
        version: 1,
        props: {
          title: "Confidential draft preview",
          text: "Only authenticated members of NextPress Flagship can view this draft in preview mode.",
          tone: "warning"
        }
      }
    ]
  };

  const post1Doc: ContentDocument = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    blocks: [
      {
        id: "blk_p1_h1",
        type: "heading",
        version: 1,
        props: { text: "Introducing the NextPress Block Registry", level: 1, align: "left" }
      },
      {
        id: "blk_p1_p1",
        type: "paragraph",
        version: 1,
        props: {
          text: "Every block in NextPress.js is backed by a strict runtime validator and a dedicated server-safe React renderer. That means no arbitrary script injection and predictable typography across every breakpoint.",
          align: "left",
          lead: true
        }
      },
      {
        id: "blk_p1_callout",
        type: "callout",
        version: 1,
        props: {
          title: "Security by design",
          text: "URLs in buttons and images are automatically sanitized against javascript: and data: URI schemes before storage and rendering.",
          tone: "info"
        }
      }
    ]
  };

  const post2Doc: ContentDocument = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    blocks: [
      {
        id: "blk_p2_h1",
        type: "heading",
        version: 1,
        props: { text: "Designing for Editorial Calm", level: 1, align: "left" }
      },
      {
        id: "blk_p2_p1",
        type: "paragraph",
        version: 1,
        props: {
          text: "Drafts, revisions, and role permissions work together so authors can write freely while editors control what goes live.",
          align: "left",
          lead: false
        }
      }
    ]
  };

  const clientHomeDoc: ContentDocument = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    blocks: [
      {
        id: "blk_nw_h1",
        type: "heading",
        version: 1,
        props: { text: "Northwind Design Studio", level: 1, align: "left" }
      },
      {
        id: "blk_nw_p1",
        type: "paragraph",
        version: 1,
        props: {
          text: "We partner with product-led companies to craft resilient design systems and high-converting web experiences.",
          align: "left",
          lead: true
        }
      }
    ]
  };

  const insertContent = db.prepare(`
    INSERT INTO content_items (
      id, site_id, kind, title, slug, excerpt, status,
      document_json, published_document_json, seo_json,
      author_id, published_at, scheduled_for, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `);

  const insertRevision = db.prepare(`
    INSERT INTO revisions (
      id, content_id, site_id, version, title, slug, document_json, seo_json, note, author_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Page 1: Published Home
  const homeSeo: SeoMetadata = {
    metaTitle: "Welcome to NextPress.js — Modern Block CMS",
    metaDescription: "Create, preview, and publish structured pages with NextPress.js.",
    canonicalUrl: "http://localhost:3000/s/flagship/home",
    noIndex: false
  };
  insertContent.run(
    "cnt_page_home",
    "site_flagship",
    "page",
    "Welcome to your new site",
    "home",
    "The flagship home page for NextPress.js.",
    "published",
    JSON.stringify(homeDoc),
    JSON.stringify(homeDoc),
    JSON.stringify(homeSeo),
    "usr_owner",
    now,
    now,
    now
  );
  insertRevision.run(
    "rev_home_1",
    "cnt_page_home",
    "site_flagship",
    1,
    "Welcome to your new site",
    "home",
    JSON.stringify(homeDoc),
    JSON.stringify(homeSeo),
    "Initial published release",
    "usr_owner",
    now
  );

  // Page 2: Published About
  const aboutSeo: SeoMetadata = {
    metaTitle: "About NextPress.js",
    metaDescription: "Learn how NextPress.js combines structured content and visual building.",
    canonicalUrl: "http://localhost:3000/s/flagship/about",
    noIndex: false
  };
  insertContent.run(
    "cnt_page_about",
    "site_flagship",
    "page",
    "About NextPress",
    "about",
    "Why we built a unified block and visual CMS in Next.js.",
    "published",
    JSON.stringify(aboutDoc),
    JSON.stringify(aboutDoc),
    JSON.stringify(aboutSeo),
    "usr_admin",
    now,
    now,
    now
  );
  insertRevision.run(
    "rev_about_1",
    "cnt_page_about",
    "site_flagship",
    1,
    "About NextPress",
    "about",
    JSON.stringify(aboutDoc),
    JSON.stringify(aboutSeo),
    "Initial publication",
    "usr_admin",
    now
  );

  // Page 3: Draft Roadmap
  const roadmapSeo: SeoMetadata = {
    metaTitle: "2026 Product Roadmap (Draft)",
    metaDescription: "Upcoming visual builder and extensibility milestones.",
    noIndex: true
  };
  insertContent.run(
    "cnt_page_roadmap",
    "site_flagship",
    "page",
    "Our 2026 Roadmap",
    "roadmap",
    "Internal draft outlining upcoming visual builder capabilities.",
    "draft",
    JSON.stringify(draftPageDoc),
    null,
    JSON.stringify(roadmapSeo),
    "usr_editor",
    null,
    now,
    now
  );
  insertRevision.run(
    "rev_roadmap_1",
    "cnt_page_roadmap",
    "site_flagship",
    1,
    "Our 2026 Roadmap",
    "roadmap",
    JSON.stringify(draftPageDoc),
    JSON.stringify(roadmapSeo),
    "Initial draft saved",
    "usr_editor",
    now
  );

  // Post 1: Published Post
  const post1Seo: SeoMetadata = {
    metaTitle: "Introducing the NextPress Block Registry",
    metaDescription: "How validated block schemas protect public rendering.",
    noIndex: false
  };
  insertContent.run(
    "cnt_post_registry",
    "site_flagship",
    "post",
    "Introducing the NextPress Block Registry",
    "introducing-the-block-registry",
    "Every block is backed by a runtime schema and safe renderer.",
    "published",
    JSON.stringify(post1Doc),
    JSON.stringify(post1Doc),
    JSON.stringify(post1Seo),
    "usr_owner",
    now,
    now,
    now
  );
  insertRevision.run(
    "rev_post1_1",
    "cnt_post_registry",
    "site_flagship",
    1,
    "Introducing the NextPress Block Registry",
    "introducing-the-block-registry",
    JSON.stringify(post1Doc),
    JSON.stringify(post1Seo),
    "Published launch post",
    "usr_owner",
    now
  );

  // Post 2: Draft Post by Author
  const post2Seo: SeoMetadata = {
    metaTitle: "Designing for Editorial Calm",
    metaDescription: "Notes on revision safety and role guardrails.",
    noIndex: false
  };
  insertContent.run(
    "cnt_post_calm",
    "site_flagship",
    "post",
    "Designing for Editorial Calm",
    "designing-for-editorial-calm",
    "How drafts, previews, and roles help teams collaborate safely.",
    "draft",
    JSON.stringify(post2Doc),
    null,
    JSON.stringify(post2Seo),
    "usr_author",
    null,
    now,
    now
  );
  insertRevision.run(
    "rev_post2_1",
    "cnt_post_calm",
    "site_flagship",
    1,
    "Designing for Editorial Calm",
    "designing-for-editorial-calm",
    JSON.stringify(post2Doc),
    JSON.stringify(post2Seo),
    "Author first draft",
    "usr_author",
    now
  );

  // Client Site Page
  insertContent.run(
    "cnt_nw_home",
    "site_northwind",
    "page",
    "Northwind Studio Home",
    "home",
    "Agency homepage for Northwind Design Studio.",
    "published",
    JSON.stringify(clientHomeDoc),
    JSON.stringify(clientHomeDoc),
    JSON.stringify({ metaTitle: "Northwind Design Studio", metaDescription: "Digital product studio" }),
    "usr_owner",
    now,
    now,
    now
  );

  // Link taxonomies to posts
  const insertContentTax = db.prepare(
    "INSERT INTO content_taxonomies (content_id, taxonomy_id) VALUES (?, ?)"
  );
  insertContentTax.run("cnt_post_registry", "tax_eng");
  insertContentTax.run("cnt_post_registry", "tax_tag_blocks");
  insertContentTax.run("cnt_post_calm", "tax_prod");
  insertContentTax.run("cnt_post_calm", "tax_tag_cms");
}

function mapSiteRow(row: Record<string, unknown>): SiteRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    domain: row.domain ? String(row.domain) : null,
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    ownerId: String(row.owner_id),
    themeSettings: JSON.parse(String(row.theme_settings_json || "{}")),
    seoDefaults: JSON.parse(String(row.seo_defaults_json || "{}")),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapContentItemRow(db: DatabaseSync, row: Record<string, unknown>): ContentItemRecord {
  const taxRows = db
    .prepare("SELECT taxonomy_id FROM content_taxonomies WHERE content_id = ?")
    .all(String(row.id)) as { taxonomy_id: string }[];

  const parsedDoc = validateAndMigrateDocument(
    JSON.parse(String(row.document_json || '{"schemaVersion":1,"blocks":[]}'))
  ).document;

  const parsedPubDoc = row.published_document_json
    ? validateAndMigrateDocument(JSON.parse(String(row.published_document_json))).document
    : null;

  return {
    id: String(row.id),
    siteId: String(row.site_id),
    kind: row.kind as ContentKind,
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt ?? ""),
    status: row.status as ContentStatus,
    document: parsedDoc,
    publishedDocument: parsedPubDoc,
    seo: validateSeoMetadata(JSON.parse(String(row.seo_json || "{}"))),
    authorId: String(row.author_id),
    authorName: String(row.author_name ?? "NextPress Editor"),
    publishedAt: row.published_at ? String(row.published_at) : null,
    scheduledFor: row.scheduled_for ? String(row.scheduled_for) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    taxonomyIds: taxRows.map((t) => t.taxonomy_id)
  };
}

export function listDemoUsers(): Array<UserRecord & { primaryRole: SiteRole }> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.avatar_initials, u.status, m.role
       FROM users u
       LEFT JOIN memberships m ON m.user_id = u.id AND m.site_id = 'site_flagship'
       ORDER BY CASE m.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'editor' THEN 3
         ELSE 4
       END`
    )
    .all() as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    email: String(r.email),
    name: String(r.name),
    avatarInitials: String(r.avatar_initials),
    status: String(r.status),
    primaryRole: (r.role as SiteRole) || "author"
  }));
}

export function authenticateUser(email: string, password: string): UserRecord | null {
  const db = getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const hash = hashPassword(password);
  const row = db
    .prepare(
      "SELECT id, email, name, avatar_initials, status FROM users WHERE LOWER(email) = ? AND password_hash = ? AND status = 'active'"
    )
    .get(normalizedEmail, hash) as Record<string, unknown> | undefined;

  if (!row) return null;
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    avatarInitials: String(row.avatar_initials),
    status: String(row.status)
  };
}

export function createSessionForUser(userId: string, preferredSiteId?: string): SessionContext | null {
  const db = getDb();
  const userRow = db
    .prepare("SELECT id, email, name, avatar_initials, status FROM users WHERE id = ? AND status = 'active'")
    .get(userId) as Record<string, unknown> | undefined;
  if (!userRow) return null;

  const memberships = listUserMemberships(userId);
  if (memberships.length === 0) return null;

  const chosen =
    memberships.find((m) => m.site.id === preferredSiteId) ?? memberships[0];

  const token = `nps_${crypto.randomBytes(24).toString("hex")}`;
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days

  db.prepare(
    "INSERT INTO sessions (token, user_id, active_site_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(token, userId, chosen.site.id, expires.toISOString(), now.toISOString());

  return {
    token,
    user: {
      id: String(userRow.id),
      email: String(userRow.email),
      name: String(userRow.name),
      avatarInitials: String(userRow.avatar_initials),
      status: String(userRow.status)
    },
    activeSite: chosen.site,
    role: chosen.role,
    memberships
  };
}

export function getSessionByToken(token: string | undefined | null): SessionContext | null {
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.token, s.user_id, s.active_site_id, s.expires_at,
              u.email, u.name, u.avatar_initials, u.status
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND u.status = 'active'`
    )
    .get(token) as Record<string, unknown> | undefined;

  if (!row) return null;
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return null;
  }

  const userId = String(row.user_id);
  const memberships = listUserMemberships(userId);
  if (memberships.length === 0) return null;

  const active =
    memberships.find((m) => m.site.id === String(row.active_site_id)) ?? memberships[0];

  return {
    token: String(row.token),
    user: {
      id: userId,
      email: String(row.email),
      name: String(row.name),
      avatarInitials: String(row.avatar_initials),
      status: String(row.status)
    },
    activeSite: active.site,
    role: active.role,
    memberships
  };
}

export function switchSessionActiveSite(token: string, targetSiteId: string): boolean {
  const db = getDb();
  const session = getSessionByToken(token);
  if (!session) return false;
  const allowed = session.memberships.some((m) => m.site.id === targetSiteId);
  if (!allowed) return false;
  db.prepare("UPDATE sessions SET active_site_id = ? WHERE token = ?").run(targetSiteId, token);
  return true;
}

export function deleteSessionByToken(token: string | undefined | null): void {
  if (!token) return;
  const db = getDb();
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function listUserMemberships(userId: string): SiteMembershipInfo[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.role, s.*
       FROM memberships m
       JOIN sites s ON s.id = m.site_id
       WHERE m.user_id = ? AND m.status = 'active'
       ORDER BY s.created_at ASC`
    )
    .all(userId) as Record<string, unknown>[];

  return rows.map((r) => ({
    role: r.role as SiteRole,
    site: mapSiteRow(r)
  }));
}

export function getUserRoleForSite(userId: string, siteId: string): SiteRole | null {
  const db = getDb();
  const row = db
    .prepare(
      "SELECT role FROM memberships WHERE user_id = ? AND site_id = ? AND status = 'active'"
    )
    .get(userId, siteId) as { role: SiteRole } | undefined;
  return row ? row.role : null;
}

export function getSiteBySlug(slug: string): SiteRecord | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM sites WHERE slug = ?")
    .get(slug.trim().toLowerCase()) as Record<string, unknown> | undefined;
  return row ? mapSiteRow(row) : null;
}

export function getSiteById(siteId: string): SiteRecord | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM sites WHERE id = ?")
    .get(siteId) as Record<string, unknown> | undefined;
  return row ? mapSiteRow(row) : null;
}

export function listAllPublicSites(): SiteRecord[] {
  const db = getDb();
  const rows = db.prepare("SELECT * FROM sites ORDER BY created_at ASC").all() as Record<string, unknown>[];
  return rows.map(mapSiteRow);
}

export function listSiteMembers(siteId: string): Array<{
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  avatarInitials: string;
  role: SiteRole;
  createdAt: string;
}> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.id as membership_id, m.role, m.created_at, u.id as user_id, u.name, u.email, u.avatar_initials
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.site_id = ? AND m.status = 'active'
       ORDER BY CASE m.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'editor' THEN 3
         ELSE 4
       END`
    )
    .all(siteId) as Record<string, unknown>[];

  return rows.map((r) => ({
    membershipId: String(r.membership_id),
    userId: String(r.user_id),
    name: String(r.name),
    email: String(r.email),
    avatarInitials: String(r.avatar_initials),
    role: r.role as SiteRole,
    createdAt: String(r.created_at)
  }));
}

export function listContentItems(
  siteId: string,
  options?: { kind?: ContentKind; status?: ContentStatus; search?: string }
): ContentSummary[] {
  const db = getDb();
  const clauses: string[] = ["c.site_id = ?"];
  const params: (string | number)[] = [siteId];

  if (options?.kind) {
    clauses.push("c.kind = ?");
    params.push(options.kind);
  }
  if (options?.status) {
    clauses.push("c.status = ?");
    params.push(options.status);
  }
  if (options?.search && options.search.trim()) {
    clauses.push("(LOWER(c.title) LIKE ? OR LOWER(c.slug) LIKE ?)");
    const q = `%${options.search.trim().toLowerCase()}%`;
    params.push(q, q);
  }

  const rows = db
    .prepare(
      `SELECT c.id, c.site_id, c.kind, c.title, c.slug, c.excerpt, c.status,
              c.author_id, u.name as author_name, c.published_at, c.updated_at, c.created_at
       FROM content_items c
       JOIN users u ON u.id = c.author_id
       WHERE ${clauses.join(" AND ")}
       ORDER BY c.updated_at DESC`
    )
    .all(...params) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    siteId: String(r.site_id),
    kind: r.kind as ContentKind,
    title: String(r.title),
    slug: String(r.slug),
    excerpt: String(r.excerpt ?? ""),
    status: r.status as ContentStatus,
    authorId: String(r.author_id),
    authorName: String(r.author_name),
    publishedAt: r.published_at ? String(r.published_at) : null,
    updatedAt: String(r.updated_at),
    createdAt: String(r.created_at)
  }));
}

export function getContentItemById(siteId: string, contentId: string): ContentItemRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.*, u.name as author_name
       FROM content_items c
       JOIN users u ON u.id = c.author_id
       WHERE c.site_id = ? AND c.id = ?`
    )
    .get(siteId, contentId) as Record<string, unknown> | undefined;

  if (!row) return null;
  return mapContentItemRow(db, row);
}

/**
 * Loads ONLY published content for public visitor rendering.
 * Never returns draft, scheduled, or archived content, and uses published_document_json.
 */
export function getPublishedContentBySlug(
  siteSlug: string,
  kind: ContentKind,
  contentSlug: string
): { site: SiteRecord; item: ContentItemRecord; renderDocument: ContentDocument } | null {
  const db = getDb();
  const site = getSiteBySlug(siteSlug);
  if (!site) return null;

  const row = db
    .prepare(
      `SELECT c.*, u.name as author_name
       FROM content_items c
       JOIN users u ON u.id = c.author_id
       WHERE c.site_id = ? AND c.kind = ? AND c.slug = ? AND c.status = 'published'`
    )
    .get(site.id, kind, normalizeSlug(contentSlug)) as Record<string, unknown> | undefined;

  if (!row) return null;
  const item = mapContentItemRow(db, row);
  const renderDocument = item.publishedDocument ?? item.document;
  return { site, item, renderDocument };
}

export function listPublishedContentForSite(
  siteId: string,
  kind?: ContentKind
): ContentSummary[] {
  return listContentItems(siteId, { kind, status: "published" });
}

export function createContentItem(input: {
  siteId: string;
  actorId: string;
  kind: ContentKind;
  title: string;
  slug?: string;
  excerpt?: string;
  document?: unknown;
  seo?: unknown;
}): { ok: true; item: ContentItemRecord } | { ok: false; error: string } {
  const db = getDb();
  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!hasPermission(role, "content:create")) {
    return { ok: false, error: "Forbidden: your role cannot create content on this site." };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Title is required." };
  }

  let baseSlug = normalizeSlug(input.slug?.trim() || title);
  const existing = db
    .prepare("SELECT id FROM content_items WHERE site_id = ? AND kind = ? AND slug = ?")
    .get(input.siteId, input.kind, baseSlug);
  if (existing) {
    baseSlug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const defaultDoc: ContentDocument = {
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    blocks: [
      {
        id: `blk_${Math.random().toString(36).slice(2, 9)}`,
        type: "heading",
        version: 1,
        props: { text: title, level: 1, align: "left" }
      },
      {
        id: `blk_${Math.random().toString(36).slice(2, 9)}`,
        type: "paragraph",
        version: 1,
        props: {
          text: "Start writing or add blocks from the palette below.",
          align: "left",
          lead: true
        }
      }
    ]
  };

  const docValidation = input.document
    ? validateAndMigrateDocument(input.document)
    : { valid: true, document: defaultDoc, errors: [] };

  if (!docValidation.valid) {
    return { ok: false, error: `Invalid content document: ${docValidation.errors.join("; ")}` };
  }

  const seo = validateSeoMetadata(input.seo ?? { metaTitle: title });
  const now = new Date().toISOString();
  const id = generateId(input.kind === "page" ? "cnt_page" : "cnt_post");

  db.prepare(
    `INSERT INTO content_items (
      id, site_id, kind, title, slug, excerpt, status,
      document_json, published_document_json, seo_json,
      author_id, published_at, scheduled_for, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, NULL, ?, ?, NULL, NULL, ?, ?)`
  ).run(
    id,
    input.siteId,
    input.kind,
    title,
    baseSlug,
    (input.excerpt ?? "").trim().slice(0, 500),
    JSON.stringify(docValidation.document),
    JSON.stringify(seo),
    input.actorId,
    now,
    now
  );

  // Save revision v1
  db.prepare(
    `INSERT INTO revisions (
      id, content_id, site_id, version, title, slug, document_json, seo_json, note, author_id, created_at
    ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, 'Initial draft created', ?, ?)`
  ).run(
    generateId("rev"),
    id,
    input.siteId,
    title,
    baseSlug,
    JSON.stringify(docValidation.document),
    JSON.stringify(seo),
    input.actorId,
    now
  );

  recordAuditLog({
    siteId: input.siteId,
    actorId: input.actorId,
    action: `${input.kind}.create`,
    entityType: input.kind,
    entityId: id,
    details: { title, slug: baseSlug }
  });

  const created = getContentItemById(input.siteId, id)!;
  return { ok: true, item: created };
}

export function updateContentItem(input: {
  siteId: string;
  contentId: string;
  actorId: string;
  title: string;
  slug: string;
  excerpt: string;
  document: unknown;
  seo: unknown;
  taxonomyIds?: string[];
  revisionNote?: string;
}): { ok: true; item: ContentItemRecord } | { ok: false; error: string } {
  const db = getDb();
  const existing = getContentItemById(input.siteId, input.contentId);
  if (!existing) {
    return { ok: false, error: "Content item not found." };
  }

  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!canEditContent(role, input.actorId, existing.authorId)) {
    return { ok: false, error: "Forbidden: you do not have permission to edit this content." };
  }

  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Title cannot be empty." };
  }

  const slug = normalizeSlug(input.slug || title);
  const slugConflict = db
    .prepare(
      "SELECT id FROM content_items WHERE site_id = ? AND kind = ? AND slug = ? AND id != ?"
    )
    .get(input.siteId, existing.kind, slug, existing.id);
  if (slugConflict) {
    return { ok: false, error: `The slug "${slug}" is already in use for another ${existing.kind} on this site.` };
  }

  const docValidation = validateAndMigrateDocument(input.document);
  if (!docValidation.valid) {
    return { ok: false, error: `Invalid block data: ${docValidation.errors.join("; ")}` };
  }

  const seo = validateSeoMetadata(input.seo);
  const now = new Date().toISOString();

  // If already published and the user has publish rights, keep published_document_json in sync when saving,
  // or if user is an author editing a draft, only update document_json.
  const updatedPublishedDoc =
    existing.status === "published" && hasPermission(role, "content:publish")
      ? JSON.stringify(docValidation.document)
      : existing.publishedDocument
        ? JSON.stringify(existing.publishedDocument)
        : null;

  db.prepare(
    `UPDATE content_items
     SET title = ?, slug = ?, excerpt = ?, document_json = ?, published_document_json = ?, seo_json = ?, updated_at = ?
     WHERE id = ? AND site_id = ?`
  ).run(
    title,
    slug,
    input.excerpt.trim().slice(0, 500),
    JSON.stringify(docValidation.document),
    updatedPublishedDoc,
    JSON.stringify(seo),
    now,
    existing.id,
    input.siteId
  );

  if (Array.isArray(input.taxonomyIds)) {
    db.prepare("DELETE FROM content_taxonomies WHERE content_id = ?").run(existing.id);
    const insTax = db.prepare(
      "INSERT OR IGNORE INTO content_taxonomies (content_id, taxonomy_id) VALUES (?, ?)"
    );
    for (const taxId of input.taxonomyIds) {
      insTax.run(existing.id, taxId);
    }
  }

  const maxRevRow = db
    .prepare("SELECT COALESCE(MAX(version), 0) as max_ver FROM revisions WHERE content_id = ?")
    .get(existing.id) as { max_ver: number };
  const nextVersion = maxRevRow.max_ver + 1;

  db.prepare(
    `INSERT INTO revisions (
      id, content_id, site_id, version, title, slug, document_json, seo_json, note, author_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    generateId("rev"),
    existing.id,
    input.siteId,
    nextVersion,
    title,
    slug,
    JSON.stringify(docValidation.document),
    JSON.stringify(seo),
    (input.revisionNote || `Saved revision v${nextVersion}`).slice(0, 200),
    input.actorId,
    now
  );

  recordAuditLog({
    siteId: input.siteId,
    actorId: input.actorId,
    action: `${existing.kind}.update`,
    entityType: existing.kind,
    entityId: existing.id,
    details: { title, slug, version: nextVersion }
  });

  return { ok: true, item: getContentItemById(input.siteId, existing.id)! };
}

export function setContentPublicationStatus(input: {
  siteId: string;
  contentId: string;
  actorId: string;
  status: "published" | "draft" | "archived";
}): { ok: true; item: ContentItemRecord } | { ok: false; error: string } {
  const db = getDb();
  const existing = getContentItemById(input.siteId, input.contentId);
  if (!existing) {
    return { ok: false, error: "Content item not found." };
  }

  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!hasPermission(role, "content:publish")) {
    return {
      ok: false,
      error: "Forbidden: your role does not permit publishing or unpublishing content."
    };
  }

  const now = new Date().toISOString();
  const publishedAt = input.status === "published" ? now : null;
  const publishedDocJson =
    input.status === "published" ? JSON.stringify(existing.document) : null;

  db.prepare(
    `UPDATE content_items
     SET status = ?, published_at = ?, published_document_json = ?, updated_at = ?
     WHERE id = ? AND site_id = ?`
  ).run(input.status, publishedAt, publishedDocJson, now, existing.id, input.siteId);

  recordAuditLog({
    siteId: input.siteId,
    actorId: input.actorId,
    action: `${existing.kind}.${input.status === "published" ? "publish" : "unpublish"}`,
    entityType: existing.kind,
    entityId: existing.id,
    details: { title: existing.title, slug: existing.slug, status: input.status }
  });

  return { ok: true, item: getContentItemById(input.siteId, existing.id)! };
}

export function deleteContentItem(input: {
  siteId: string;
  contentId: string;
  actorId: string;
}): { ok: true } | { ok: false; error: string } {
  const db = getDb();
  const existing = getContentItemById(input.siteId, input.contentId);
  if (!existing) {
    return { ok: false, error: "Content item not found." };
  }

  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!hasPermission(role, "content:delete")) {
    return { ok: false, error: "Forbidden: your role cannot delete content." };
  }

  db.prepare("DELETE FROM content_items WHERE id = ? AND site_id = ?").run(
    existing.id,
    input.siteId
  );

  recordAuditLog({
    siteId: input.siteId,
    actorId: input.actorId,
    action: `${existing.kind}.delete`,
    entityType: existing.kind,
    entityId: existing.id,
    details: { title: existing.title, slug: existing.slug }
  });

  return { ok: true };
}

export function listRevisions(siteId: string, contentId: string): RevisionRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT r.*, u.name as author_name
       FROM revisions r
       JOIN users u ON u.id = r.author_id
       WHERE r.site_id = ? AND r.content_id = ?
       ORDER BY r.version DESC`
    )
    .all(siteId, contentId) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    contentId: String(r.content_id),
    siteId: String(r.site_id),
    version: Number(r.version),
    title: String(r.title),
    slug: String(r.slug),
    document: validateAndMigrateDocument(JSON.parse(String(r.document_json))).document,
    seo: validateSeoMetadata(JSON.parse(String(r.seo_json || "{}"))),
    note: String(r.note ?? ""),
    authorId: String(r.author_id),
    authorName: String(r.author_name),
    createdAt: String(r.created_at)
  }));
}

export function restoreRevision(input: {
  siteId: string;
  contentId: string;
  revisionId: string;
  actorId: string;
}): { ok: true; item: ContentItemRecord } | { ok: false; error: string } {
  const db = getDb();
  const revRow = db
    .prepare("SELECT * FROM revisions WHERE id = ? AND content_id = ? AND site_id = ?")
    .get(input.revisionId, input.contentId, input.siteId) as Record<string, unknown> | undefined;

  if (!revRow) {
    return { ok: false, error: "Revision not found." };
  }

  const existing = getContentItemById(input.siteId, input.contentId);
  if (!existing) {
    return { ok: false, error: "Content item not found." };
  }

  return updateContentItem({
    siteId: input.siteId,
    contentId: input.contentId,
    actorId: input.actorId,
    title: String(revRow.title),
    slug: String(revRow.slug),
    excerpt: existing.excerpt,
    document: JSON.parse(String(revRow.document_json)),
    seo: JSON.parse(String(revRow.seo_json || "{}")),
    revisionNote: `Restored from revision v${String(revRow.version)}`
  });
}

export function listMediaAssets(siteId: string): MediaAssetRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM media_assets WHERE site_id = ? ORDER BY created_at DESC")
    .all(siteId) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    siteId: String(r.site_id),
    filename: String(r.filename),
    storageKey: String(r.storage_key),
    url: String(r.url),
    mimeType: String(r.mime_type),
    sizeBytes: Number(r.size_bytes),
    width: r.width !== null ? Number(r.width) : null,
    height: r.height !== null ? Number(r.height) : null,
    altText: String(r.alt_text ?? ""),
    caption: String(r.caption ?? ""),
    uploadedBy: String(r.uploaded_by),
    createdAt: String(r.created_at)
  }));
}

const ALLOWED_MEDIA_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf"
]);

export function registerMediaAsset(input: {
  siteId: string;
  actorId: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  altText: string;
  caption?: string;
}): { ok: true; asset: MediaAssetRecord } | { ok: false; error: string } {
  const db = getDb();
  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!hasPermission(role, "media:manage")) {
    return { ok: false, error: "Forbidden: your role cannot manage media assets." };
  }

  const filename = input.filename.trim();
  if (!filename) {
    return { ok: false, error: "Filename is required." };
  }

  if (!ALLOWED_MEDIA_MIMES.has(input.mimeType)) {
    return { ok: false, error: `Unsupported MIME type: ${input.mimeType}` };
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > 10 * 1024 * 1024) {
    return { ok: false, error: "File size must be between 1 byte and 10 MB." };
  }

  const id = generateId("med");
  const safeKey = `${input.siteId}/${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO media_assets (
      id, site_id, filename, storage_key, url, mime_type, size_bytes, width, height, alt_text, caption, uploaded_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.siteId,
    filename,
    safeKey,
    input.url.trim(),
    input.mimeType,
    Math.floor(input.sizeBytes),
    input.width ?? null,
    input.height ?? null,
    input.altText.trim().slice(0, 500),
    (input.caption ?? "").trim().slice(0, 500),
    input.actorId,
    now
  );

  recordAuditLog({
    siteId: input.siteId,
    actorId: input.actorId,
    action: "media.register",
    entityType: "media",
    entityId: id,
    details: { filename, mimeType: input.mimeType }
  });

  const assets = listMediaAssets(input.siteId);
  return { ok: true, asset: assets.find((a) => a.id === id)! };
}

export function deleteMediaAsset(input: {
  siteId: string;
  assetId: string;
  actorId: string;
}): { ok: true } | { ok: false; error: string } {
  const db = getDb();
  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!hasPermission(role, "media:manage")) {
    return { ok: false, error: "Forbidden: your role cannot delete media assets." };
  }
  db.prepare("DELETE FROM media_assets WHERE id = ? AND site_id = ?").run(
    input.assetId,
    input.siteId
  );
  return { ok: true };
}

export function listTaxonomies(siteId: string): TaxonomyRecord[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM taxonomies WHERE site_id = ? ORDER BY type ASC, name ASC")
    .all(siteId) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    siteId: String(r.site_id),
    name: String(r.name),
    slug: String(r.slug),
    type: r.type as "category" | "tag",
    description: String(r.description ?? ""),
    createdAt: String(r.created_at)
  }));
}

export function createTaxonomy(input: {
  siteId: string;
  actorId: string;
  name: string;
  type: "category" | "tag";
  description?: string;
}): { ok: true; taxonomy: TaxonomyRecord } | { ok: false; error: string } {
  const db = getDb();
  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!hasPermission(role, "taxonomy:manage")) {
    return { ok: false, error: "Forbidden: your role cannot manage taxonomies." };
  }

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Taxonomy name is required." };
  const slug = normalizeSlug(name);
  const id = generateId("tax");
  const now = new Date().toISOString();

  try {
    db.prepare(
      `INSERT INTO taxonomies (id, site_id, name, slug, type, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, input.siteId, name, slug, input.type, (input.description ?? "").trim(), now);
  } catch {
    return { ok: false, error: `A ${input.type} with slug "${slug}" already exists.` };
  }

  return {
    ok: true,
    taxonomy: {
      id,
      siteId: input.siteId,
      name,
      slug,
      type: input.type,
      description: (input.description ?? "").trim(),
      createdAt: now
    }
  };
}

export function updateSiteSettings(input: {
  siteId: string;
  actorId: string;
  name: string;
  tagline: string;
  description: string;
  domain: string;
  themeSettings: ThemeSettings;
  seoDefaults: SeoMetadata;
}): { ok: true; site: SiteRecord } | { ok: false; error: string } {
  const db = getDb();
  const role = getUserRoleForSite(input.actorId, input.siteId);
  if (!hasPermission(role, "site:manage")) {
    return { ok: false, error: "Forbidden: only Owners and Administrators can modify site settings." };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Site name is required." };
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE sites
     SET name = ?, tagline = ?, description = ?, domain = ?, theme_settings_json = ?, seo_defaults_json = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    name,
    input.tagline.trim().slice(0, 200),
    input.description.trim().slice(0, 500),
    input.domain.trim() || null,
    JSON.stringify(input.themeSettings),
    JSON.stringify(validateSeoMetadata(input.seoDefaults)),
    now,
    input.siteId
  );

  recordAuditLog({
    siteId: input.siteId,
    actorId: input.actorId,
    action: "site.settings.update",
    entityType: "site",
    entityId: input.siteId,
    details: { name }
  });

  return { ok: true, site: getSiteById(input.siteId)! };
}

export function recordAuditLog(input: {
  siteId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
}): void {
  const db = getDb();
  db.prepare(
    `INSERT INTO audit_logs (id, site_id, actor_id, action, entity_type, entity_id, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    generateId("aud"),
    input.siteId,
    input.actorId,
    input.action,
    input.entityType,
    input.entityId,
    JSON.stringify(input.details ?? {}),
    new Date().toISOString()
  );
}

export function listAuditLogs(siteId: string, limit = 15): AuditLogRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.*, u.name as actor_name
       FROM audit_logs a
       JOIN users u ON u.id = a.actor_id
       WHERE a.site_id = ?
       ORDER BY a.created_at DESC
       LIMIT ?`
    )
    .all(siteId, limit) as Record<string, unknown>[];

  return rows.map((r) => ({
    id: String(r.id),
    siteId: String(r.site_id),
    actorId: String(r.actor_id),
    actorName: String(r.actor_name),
    action: String(r.action),
    entityType: String(r.entity_type),
    entityId: String(r.entity_id),
    details: JSON.parse(String(r.details_json || "{}")),
    createdAt: String(r.created_at)
  }));
}
