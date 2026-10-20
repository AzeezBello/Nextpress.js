import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeSlug,
  sanitizeUrl,
  validateAndMigrateDocument,
  validateAndNormalizeBlock
} from "../src/lib/content-types.ts";
import { canEditContent, hasPermission } from "../src/lib/permissions.ts";
import {
  authenticateUser,
  createContentItem,
  createSessionForUser,
  getPublishedContentBySlug,
  installNodePluginPackage,
  listNotFoundLogs,
  listRevisions,
  listSitePlugins,
  logNotFoundHit,
  matchRedirectForPath,
  registerMediaAsset,
  resetDbForTests,
  restoreRevision,
  setContentPublicationStatus,
  switchSessionActiveSite,
  toggleSitePlugin,
  updateContentItem,
  updateSiteSettings
} from "../src/lib/db.ts";
import {
  analyzeSeoAndReadability,
  buildSchemaGraph,
  resolveSmartTags
} from "../src/lib/seo-engine.ts";
import {
  isValidNpmPackageName,
  NODE_PLUGIN_DIRECTORY,
  searchNodePluginDirectory
} from "../src/lib/plugins.ts";

describe("NextPress.js Core CMS & Publishing Suite", () => {
  beforeEach(() => {
    process.env.NEXTPRESS_DB_PATH = ":memory:";
    resetDbForTests();
  });

  it("sanitizes unsafe URLs and validates registered block schemas", () => {
    assert.equal(sanitizeUrl("javascript:alert(1)", "#"), "#");
    assert.equal(sanitizeUrl("data:text/html,<script>alert(1)</script>", "#"), "#");
    assert.equal(sanitizeUrl("https://nextpress.dev/docs"), "https://nextpress.dev/docs");
    assert.equal(sanitizeUrl("/s/flagship/about"), "/s/flagship/about");
    assert.equal(normalizeSlug("  Hello World! 2026  "), "hello-world-2026");

    const invalidBlock = validateAndNormalizeBlock({
      id: "b1",
      type: "script_injection",
      version: 1,
      props: { code: "evil()" }
    });
    assert.equal(invalidBlock.valid, false);

    const safeButton = validateAndNormalizeBlock({
      id: "btn1",
      type: "button",
      version: 1,
      props: { label: "Click", href: "javascript:evil()", variant: "primary" }
    });
    assert.equal(safeButton.valid, true);
    assert.equal(safeButton.block?.props.href, "#");
  });

  it("enforces role hierarchy and content ownership permissions", () => {
    assert.equal(hasPermission("owner", "site:manage"), true);
    assert.equal(hasPermission("admin", "site:manage"), true);
    assert.equal(hasPermission("developer", "site:manage"), true);
    assert.equal(hasPermission("developer", "plugins:manage"), true);
    assert.equal(hasPermission("developer", "theme:manage"), true);
    assert.equal(hasPermission("developer", "members:manage"), false);
    assert.equal(hasPermission("editor", "site:manage"), false);
    assert.equal(hasPermission("editor", "content:publish"), true);
    assert.equal(hasPermission("author", "content:publish"), false);

    // Author can only edit own content
    assert.equal(canEditContent("author", "usr_author", "usr_author"), true);
    assert.equal(canEditContent("author", "usr_author", "usr_owner"), false);
    assert.equal(canEditContent("editor", "usr_editor", "usr_owner"), true);
  });

  it("authenticates seeded users and manages multi-site sessions", () => {
    const badAuth = authenticateUser("ada@nextpress.dev", "wrongpass");
    assert.equal(badAuth, null);

    const owner = authenticateUser("ada@nextpress.dev", "nextpress123");
    assert.ok(owner);
    assert.equal(owner.id, "usr_owner");

    const session = createSessionForUser(owner.id);
    assert.ok(session);
    assert.equal(session.activeSite.slug, "flagship");
    assert.equal(session.role, "owner");

    const switched = switchSessionActiveSite(session.token, "site_northwind");
    assert.equal(switched, true);
  });

  it("completes the create → edit → draft guard → publish → unpublish vertical slice", () => {
    // 1. Author creates a new draft page
    const createdRes = createContentItem({
      siteId: "site_flagship",
      actorId: "usr_author",
      kind: "page",
      title: "Architecture Deep Dive",
      slug: "architecture-deep-dive"
    });
    assert.equal(createdRes.ok, true);
    if (!createdRes.ok) return;

    const pageId = createdRes.item.id;
    assert.equal(createdRes.item.status, "draft");

    // 2. Public route must NOT expose draft content
    const publicDraftAttempt = getPublishedContentBySlug(
      "flagship",
      "page",
      "architecture-deep-dive"
    );
    assert.equal(publicDraftAttempt, null);

    // 3. Author edits own draft blocks
    const updatedRes = updateContentItem({
      siteId: "site_flagship",
      contentId: pageId,
      actorId: "usr_author",
      title: "Architecture Deep Dive (Updated)",
      slug: "architecture-deep-dive",
      excerpt: "Updated summary",
      document: {
        schemaVersion: 1,
        blocks: [
          {
            id: "blk_1",
            type: "heading",
            version: 1,
            props: { text: "Modular Monolith Design", level: 1, align: "left" }
          }
        ]
      },
      seo: { metaTitle: "Architecture Deep Dive SEO" },
      revisionNote: "Added H1 block"
    });
    assert.equal(updatedRes.ok, true);

    // 4. Author cannot publish directly
    const authorPublishAttempt = setContentPublicationStatus({
      siteId: "site_flagship",
      contentId: pageId,
      actorId: "usr_author",
      status: "published"
    });
    assert.equal(authorPublishAttempt.ok, false);

    // 5. Editor publishes the page
    const editorPublish = setContentPublicationStatus({
      siteId: "site_flagship",
      contentId: pageId,
      actorId: "usr_editor",
      status: "published"
    });
    assert.equal(editorPublish.ok, true);

    // 6. Public route now serves the published snapshot
    const livePage = getPublishedContentBySlug("flagship", "page", "architecture-deep-dive");
    assert.ok(livePage);
    assert.equal(livePage.item.title, "Architecture Deep Dive (Updated)");
    assert.equal(livePage.renderDocument.blocks[0]?.props.text, "Modular Monolith Design");

    // 7. Editor unpublishes the page; public route immediately stops serving it
    const unpub = setContentPublicationStatus({
      siteId: "site_flagship",
      contentId: pageId,
      actorId: "usr_editor",
      status: "draft"
    });
    assert.equal(unpub.ok, true);
    assert.equal(
      getPublishedContentBySlug("flagship", "page", "architecture-deep-dive"),
      null
    );
  });

  it("tracks revisions and restores previous content versions", () => {
    const created = createContentItem({
      siteId: "site_flagship",
      actorId: "usr_editor",
      kind: "post",
      title: "Version One Title",
      slug: "version-test"
    });
    assert.equal(created.ok, true);
    if (!created.ok) return;

    updateContentItem({
      siteId: "site_flagship",
      contentId: created.item.id,
      actorId: "usr_editor",
      title: "Version Two Title",
      slug: "version-test",
      excerpt: "",
      document: created.item.document,
      seo: {}
    });

    const revisions = listRevisions("site_flagship", created.item.id);
    assert.equal(revisions.length, 2);

    const v1 = revisions.find((r) => r.version === 1)!;
    const restored = restoreRevision({
      siteId: "site_flagship",
      contentId: created.item.id,
      revisionId: v1.id,
      actorId: "usr_editor"
    });
    assert.equal(restored.ok, true);
    if (!restored.ok) return;
    assert.equal(restored.item.title, "Version One Title");
  });

  it("enforces media upload MIME type, size, and site settings RBAC", () => {
    const badMime = registerMediaAsset({
      siteId: "site_flagship",
      actorId: "usr_editor",
      filename: "malware.exe",
      url: "/malware.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 1024,
      altText: "Invalid file"
    });
    assert.equal(badMime.ok, false);

    const tooLarge = registerMediaAsset({
      siteId: "site_flagship",
      actorId: "usr_editor",
      filename: "huge.png",
      url: "/huge.png",
      mimeType: "image/png",
      sizeBytes: 25 * 1024 * 1024,
      altText: "Oversized"
    });
    assert.equal(tooLarge.ok, false);

    const validMedia = registerMediaAsset({
      siteId: "site_flagship",
      actorId: "usr_editor",
      filename: "diagram.svg",
      url: "/nextpress-mark.svg",
      mimeType: "image/svg+xml",
      sizeBytes: 2048,
      altText: "Architecture diagram"
    });
    assert.equal(validMedia.ok, true);

    const editorSiteSettingsAttempt = updateSiteSettings({
      siteId: "site_flagship",
      actorId: "usr_editor",
      name: "Hacked Name",
      tagline: "",
      description: "",
      domain: "",
      themeSettings: {
        primaryColor: "#000000",
        accentColor: "#000000",
        backgroundColor: "#ffffff",
        headingFont: "system",
        bodyFont: "system",
        borderRadius: "rounded"
      },
      seoDefaults: {}
    });
    assert.equal(editorSiteSettingsAttempt.ok, false);

    const docMigration = validateAndMigrateDocument({
      schemaVersion: 0,
      blocks: [
        { id: "h1", type: "heading", version: 1, props: { text: "Migrated", level: 2 } }
      ]
    });
    assert.equal(docMigration.valid, true);
    assert.equal(docMigration.document.schemaVersion, 1);
  });

  it("evaluates Rank Math + Yoast + AIOSEO Smart Tags, TruSEO score, and Schema.org @graph", () => {
    const resolvedTitle = resolveSmartTags("%%title%% %%sep%% %%sitename%% (%%current_year%%)", {
      title: "Block Registry Guide",
      excerpt: "Deep dive",
      siteName: "NextPress Flagship",
      tagline: "Publish with clarity",
      separator: "—"
    });
    assert.ok(resolvedTitle.includes("Block Registry Guide — NextPress Flagship"));

    const homePublished = getPublishedContentBySlug("flagship", "page", "home");
    assert.ok(homePublished);

    const report = analyzeSeoAndReadability({
      title: homePublished.item.title,
      slug: homePublished.item.slug,
      excerpt: homePublished.item.excerpt,
      kind: homePublished.item.kind,
      document: homePublished.renderDocument,
      seo: homePublished.item.seo,
      siteName: homePublished.site.name,
      siteTagline: homePublished.site.tagline
    });
    assert.ok(report.overallScore > 0 && report.overallScore <= 100);
    assert.equal(report.checks.length, 15);

    const graph = buildSchemaGraph({
      site: homePublished.site,
      item: {
        ...homePublished.item,
        document: homePublished.renderDocument
      },
      baseUrl: "http://localhost:3000"
    }) as { "@graph": Array<Record<string, unknown>> };

    assert.ok(Array.isArray(graph["@graph"]));
    const hasFaqEntity = graph["@graph"].some((node) => node["@type"] === "FAQPage");
    assert.equal(hasFaqEntity, true);
  });

  it("auto-creates a 301 redirect when a published slug changes and logs 404 hits", () => {
    const aboutPublished = getPublishedContentBySlug("flagship", "page", "about");
    assert.ok(aboutPublished);

    // Rename published page slug from "about" to "about-nextpress"
    const updated = updateContentItem({
      siteId: "site_flagship",
      contentId: aboutPublished.item.id,
      actorId: "usr_admin",
      title: aboutPublished.item.title,
      slug: "about-nextpress",
      excerpt: aboutPublished.item.excerpt,
      document: aboutPublished.item.document,
      seo: aboutPublished.item.seo
    });
    assert.equal(updated.ok, true);

    const matched = matchRedirectForPath("site_flagship", "/s/flagship/about");
    assert.ok(matched);
    assert.equal(matched.redirect.statusCode, 301);
    assert.equal(matched.resolvedDestination, "/s/flagship/about-nextpress");

    logNotFoundHit({
      siteId: "site_flagship",
      path: "/s/flagship/missing-route-test",
      referrer: "https://example.com"
    });
    const logs = listNotFoundLogs("site_flagship");
    assert.ok(logs.some((l) => l.path === "/s/flagship/missing-route-test"));
  });

  it("validates and manages Node package plugins per site", () => {
    assert.equal(isValidNpmPackageName("@nextpress/plugin-newsletter"), true);
    assert.equal(isValidNpmPackageName("nextpress-plugin-stripe"), true);
    assert.equal(isValidNpmPackageName("INVALID PACKAGE NAME!!"), false);

    const initialPlugins = listSitePlugins("site_flagship");
    assert.ok(initialPlugins.length >= 4);

    // Editor cannot install Node plugins
    const forbiddenInstall = installNodePluginPackage({
      siteId: "site_flagship",
      actorId: "usr_editor",
      packageName: "@nextpress/plugin-newsletter"
    });
    assert.equal(forbiddenInstall.ok, false);

    // Developer can install and toggle a Node package plugin
    const installedByDev = installNodePluginPackage({
      siteId: "site_flagship",
      actorId: "usr_developer",
      packageName: "@nextpress/plugin-stripe-checkout"
    });
    assert.equal(installedByDev.ok, true);

    // Owner installs and toggles a Node package plugin
    const installed = installNodePluginPackage({
      siteId: "site_flagship",
      actorId: "usr_owner",
      packageName: "@nextpress/plugin-newsletter",
      displayName: "NextPress Newsletter Capture",
      version: "1.4.0"
    });
    assert.equal(installed.ok, true);
    if (!installed.ok) return;

    assert.equal(installed.plugin.enabled, true);

    const toggled = toggleSitePlugin({
      siteId: "site_flagship",
      actorId: "usr_owner",
      pluginId: installed.plugin.id,
      enabled: false
    });
    assert.equal(toggled.ok, true);

    // Dynamic search by name or category (WordPress-style Add New Plugin directory)
    assert.ok(NODE_PLUGIN_DIRECTORY.length >= 16);

    const byName = searchNodePluginDirectory({ query: "Stripe", searchBy: "name" });
    assert.ok(byName.some((p) => p.packageName === "@nextpress/plugin-stripe-checkout"));

    const byCategoryQuery = searchNodePluginDirectory({
      query: "security",
      searchBy: "category"
    });
    assert.ok(byCategoryQuery.length >= 2);
    assert.ok(byCategoryQuery.every((p) => p.category === "security"));

    const byCategoryPill = searchNodePluginDirectory({
      category: "seo"
    });
    assert.ok(byCategoryPill.length >= 2);
    assert.ok(byCategoryPill.every((p) => p.category === "seo"));

    // Custom npm package query dynamically synthesizes an installable card
    const customDynamic = searchNodePluginDirectory({
      query: "@acme/nextpress-plugin-algolia"
    });
    assert.equal(customDynamic[0]?.packageName, "@acme/nextpress-plugin-algolia");
  });
});
