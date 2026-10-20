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
  listRevisions,
  registerMediaAsset,
  resetDbForTests,
  restoreRevision,
  setContentPublicationStatus,
  switchSessionActiveSite,
  updateContentItem,
  updateSiteSettings
} from "../src/lib/db.ts";

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
});
