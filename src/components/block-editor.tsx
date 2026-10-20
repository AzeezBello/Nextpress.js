"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  Code2,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  History,
  Laptop,
  Link2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Trash2
} from "lucide-react";
import {
  BLOCK_CATALOG,
  REGISTERED_BLOCK_TYPES,
  SCHEMA_ENTITY_TYPES,
  createDefaultBlock,
  normalizeSlug,
  type BlockType,
  type ColumnsBlockItem,
  type ContentBlock,
  type ContentItemRecord,
  type ContentSummary,
  type FaqBlockItem,
  type MediaAssetRecord,
  type RevisionRecord,
  type SchemaEntityType,
  type SeoMetadata,
  type SiteRecord,
  type SiteRole,
  type TaxonomyRecord
} from "@/lib/content-types";
import { hasPermission } from "@/lib/permissions";
import {
  SMART_TAGS,
  analyzeSeoAndReadability,
  buildSchemaGraph,
  suggestInternalLinks
} from "@/lib/seo-engine";
import {
  restoreRevisionAction,
  saveContentDocumentAction,
  togglePublishContentAction
} from "@/lib/actions";
import { BlockDocumentRenderer } from "@/components/block-renderer";

type EditorTab = "blocks" | "preview" | "seo" | "revisions";
type ViewportSize = "desktop" | "tablet" | "mobile";

export function BlockEditor({
  item,
  siteSlug,
  site,
  allSiteItems = [],
  userRole,
  canEdit,
  revisions,
  mediaAssets,
  taxonomies
}: {
  item: ContentItemRecord;
  siteSlug: string;
  site?: SiteRecord;
  allSiteItems?: ContentSummary[];
  userRole: SiteRole;
  canEdit: boolean;
  revisions: RevisionRecord[];
  mediaAssets: MediaAssetRecord[];
  taxonomies: TaxonomyRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);
  const [excerpt, setExcerpt] = useState(item.excerpt);
  const [blocks, setBlocks] = useState<ContentBlock[]>(item.document.blocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    item.document.blocks[0]?.id ?? null
  );
  const [seo, setSeo] = useState<SeoMetadata>(item.seo);
  const [secondaryKeywordsInput, setSecondaryKeywordsInput] = useState(
    (item.seo.secondaryKeywords ?? []).join(", ")
  );
  const [selectedTaxonomies, setSelectedTaxonomies] = useState<string[]>(item.taxonomyIds);
  const [revisionNote, setRevisionNote] = useState("");

  const [activeTab, setActiveTab] = useState<EditorTab>("blocks");
  const [viewport, setViewport] = useState<ViewportSize>("desktop");
  const [serpDevice, setSerpDevice] = useState<"desktop" | "mobile">("desktop");
  const [showSchemaJson, setShowSchemaJson] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const canPublish = hasPermission(userRole, "content:publish");
  const publicUrl =
    item.kind === "page"
      ? `/s/${siteSlug}/${slug}`
      : `/s/${siteSlug}/blog/${slug}`;

  const currentDocument = {
    schemaVersion: item.document.schemaVersion,
    blocks
  };

  // Live Rank Math + Yoast + AIOSEO Analysis
  const seoReport = analyzeSeoAndReadability({
    title,
    slug,
    excerpt,
    kind: item.kind,
    document: currentDocument,
    seo,
    siteName: site?.name ?? "NextPress Flagship",
    siteTagline: site?.tagline ?? "",
    siteSeoDefaults: site?.seoDefaults,
    authorName: item.authorName
  });

  // Live Internal Linking Suggestions (prioritizing Cornerstone content)
  const internalLinkSuggestions = suggestInternalLinks({
    currentItemId: item.id,
    siteSlug,
    document: currentDocument,
    candidates: allSiteItems
  });

  // Live Schema.org @graph preview
  const effectiveSite: SiteRecord = site ?? {
    id: item.siteId,
    name: "NextPress Flagship",
    slug: siteSlug,
    domain: "nextpress.local",
    tagline: "",
    description: "",
    ownerId: item.authorId,
    themeSettings: {
      primaryColor: "#176B4D",
      accentColor: "#8A5A20",
      backgroundColor: "#F6F7F4",
      headingFont: "system",
      bodyFont: "system",
      borderRadius: "rounded"
    },
    seoDefaults: {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };

  const schemaGraph = buildSchemaGraph({
    site: effectiveSite,
    item: {
      ...item,
      title,
      slug,
      excerpt,
      document: currentDocument,
      seo
    },
    baseUrl: "http://localhost:3000"
  });

  function markDirty() {
    setIsDirty(true);
    setFeedback(null);
  }

  function addBlock(type: BlockType) {
    if (!canEdit) return;
    const newBlock = createDefaultBlock(type);
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    markDirty();
  }

  function insertInternalLinkBlock(targetHref: string, targetTitle: string) {
    if (!canEdit) return;
    const baseBlock = createDefaultBlock("button");
    const newBlock: ContentBlock = {
      ...baseBlock,
      props: {
        label: `Read: ${targetTitle}`,
        href: targetHref,
        variant: "outline",
        align: "left"
      }
    };
    setBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    markDirty();
    setFeedback({
      type: "success",
      message: `Added internal link block pointing to "${targetTitle}" (${targetHref}).`
    });
  }

  function updateBlockProps(blockId: string, patch: Record<string, unknown>) {
    if (!canEdit) return;
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, props: { ...b.props, ...patch } } : b))
    );
    markDirty();
  }

  function moveBlock(index: number, direction: -1 | 1) {
    if (!canEdit) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    setBlocks(copy);
    markDirty();
  }

  function duplicateBlock(index: number) {
    if (!canEdit) return;
    const source = blocks[index];
    if (!source) return;
    const cloned: ContentBlock = {
      ...structuredClone(source),
      id: `blk_${Math.random().toString(36).slice(2, 10)}`
    };
    const copy = [...blocks];
    copy.splice(index + 1, 0, cloned);
    setBlocks(copy);
    setSelectedBlockId(cloned.id);
    markDirty();
  }

  function removeBlock(blockId: string) {
    if (!canEdit) return;
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
    markDirty();
  }

  function toggleTaxonomy(taxId: string) {
    if (!canEdit) return;
    setSelectedTaxonomies((prev) =>
      prev.includes(taxId) ? prev.filter((id) => id !== taxId) : [...prev, taxId]
    );
    markDirty();
  }

  function handleSave() {
    if (!canEdit) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await saveContentDocumentAction({
        contentId: item.id,
        title,
        slug: normalizeSlug(slug || title),
        excerpt,
        document: {
          schemaVersion: item.document.schemaVersion,
          blocks
        },
        seo,
        taxonomyIds: selectedTaxonomies,
        revisionNote: revisionNote.trim() || undefined
      });

      if (!res.ok) {
        setFeedback({ type: "error", message: res.error ?? "Failed to save changes." });
        return;
      }

      setIsDirty(false);
      setRevisionNote("");
      setFeedback({
        type: "success",
        message:
          item.status === "published" && item.slug !== normalizeSlug(slug || title)
            ? `Saved changes, recorded revision, and auto-created a 301 redirect from old slug "${item.slug}".`
            : "Saved changes and recorded a new revision snapshot."
      });
      router.refresh();
    });
  }

  function handlePublishToggle(targetStatus: "published" | "draft") {
    if (!canPublish) return;
    setFeedback(null);
    startTransition(async () => {
      if (isDirty && canEdit) {
        const saveRes = await saveContentDocumentAction({
          contentId: item.id,
          title,
          slug: normalizeSlug(slug || title),
          excerpt,
          document: {
            schemaVersion: item.document.schemaVersion,
            blocks
          },
          seo,
          taxonomyIds: selectedTaxonomies,
          revisionNote: targetStatus === "published" ? "Pre-publish save" : "Pre-unpublish save"
        });
        if (!saveRes.ok) {
          setFeedback({ type: "error", message: saveRes.error ?? "Save failed before publishing." });
          return;
        }
        setIsDirty(false);
      }

      const pubRes = await togglePublishContentAction({
        contentId: item.id,
        targetStatus
      });

      if (!pubRes.ok) {
        setFeedback({
          type: "error",
          message: pubRes.error ?? "Failed to change publication status."
        });
        return;
      }

      setFeedback({
        type: "success",
        message:
          targetStatus === "published"
            ? `Published! Live at ${publicUrl}`
            : "Unpublished. Content is now private in Draft state."
      });
      router.refresh();
    });
  }

  function handleRestoreRevision(rev: RevisionRecord) {
    if (!canEdit) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await restoreRevisionAction({
        contentId: item.id,
        revisionId: rev.id
      });
      if (!res.ok) {
        setFeedback({ type: "error", message: res.error ?? "Failed to restore revision." });
        return;
      }
      setTitle(rev.title);
      setSlug(rev.slug);
      setBlocks(rev.document.blocks);
      setSeo(rev.seo);
      setSecondaryKeywordsInput((rev.seo.secondaryKeywords ?? []).join(", "));
      setIsDirty(false);
      setFeedback({
        type: "success",
        message: `Restored revision v${rev.version}.`
      });
      router.refresh();
    });
  }

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null;

  const scoreBadgeClass =
    seoReport.overallScore >= 80
      ? "bg-[#DCF4E7] text-success"
      : seoReport.overallScore >= 55
        ? "bg-[#F8EBD9] text-warning"
        : "bg-[#FBE9E9] text-danger";

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/${item.kind}s`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-canvas text-ink transition hover:border-brand hover:text-brand"
            aria-label={`Back to ${item.kind}s`}
          >
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {item.kind === "page" ? "Page Editor" : "Post Editor"}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.status === "published"
                    ? "bg-brand-soft text-brand"
                    : "bg-[#F8EBD9] text-[#8A5A20]"
                }`}
              >
                {item.status === "published" ? "Published" : "Draft"}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBadgeClass}`}>
                TruSEO {seoReport.overallScore}/100
              </span>
              {seo.isCornerstone ? (
                <span className="rounded-full bg-[#F8EBD9] px-2.5 py-0.5 text-xs font-semibold text-warning">
                  ★ Cornerstone
                </span>
              ) : null}
              {isDirty ? (
                <span className="rounded-full bg-[#F8EBD9] px-2.5 py-0.5 text-xs font-medium text-[#8A5A20]">
                  Unsaved changes
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Public route: <code className="rounded bg-canvas px-1.5 py-0.5 text-ink">{publicUrl}</code>{" "}
              · {seoReport.stats.wordCount} words · {seoReport.stats.readingTimeMinutes} min read
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/preview/${item.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
          >
            <Eye size={15} aria-hidden="true" />
            Private Preview
          </Link>

          {item.status === "published" ? (
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-4 py-2.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
            >
              <ExternalLink size={15} aria-hidden="true" />
              Visit Live URL
            </Link>
          ) : null}

          <button
            type="button"
            disabled={!canEdit || isPending}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-white px-4 py-2.5 text-xs font-semibold text-ink transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={15} aria-hidden="true" />
            {isPending ? "Saving..." : "Save Draft / Snapshot"}
          </button>

          {item.status === "published" ? (
            <button
              type="button"
              disabled={!canPublish || isPending}
              onClick={() => handlePublishToggle("draft")}
              title={!canPublish ? "Your role cannot unpublish content" : "Unpublish to draft"}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#8A5A20] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              Unpublish
            </button>
          ) : (
            <button
              type="button"
              disabled={!canPublish || isPending}
              onClick={() => handlePublishToggle("published")}
              title={
                !canPublish
                  ? "Authors cannot publish directly — ask an Editor or Admin"
                  : "Publish live"
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Globe size={15} aria-hidden="true" />
              Publish
            </button>
          )}
        </div>
      </div>

      {!canPublish ? (
        <div className="rounded-xl border border-[#E6C9A2] bg-[#F8EBD9] px-4 py-3 text-xs text-[#6E4514]">
          <strong>Role Notice ({userRole}):</strong> You can edit and save drafts or preview
          privately, but publishing and unpublishing require an <strong>Editor</strong>,{" "}
          <strong>Admin</strong>, or <strong>Owner</strong> role.
        </div>
      ) : null}

      {feedback ? (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-brand/30 bg-brand-soft text-brand"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      {/* Document Metadata Bar */}
      <div className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-3">
        <div>
          <label
            htmlFor="doc-title"
            className="block text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Title
          </label>
          <input
            id="doc-title"
            type="text"
            disabled={!canEdit}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm font-medium text-ink focus:border-brand"
          />
        </div>
        <div>
          <label
            htmlFor="doc-slug"
            className="block text-xs font-semibold uppercase tracking-wider text-muted"
          >
            URL Slug {item.status === "published" ? "(Auto-301 on rename)" : ""}
          </label>
          <input
            id="doc-slug"
            type="text"
            disabled={!canEdit}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              markDirty();
            }}
            className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink focus:border-brand"
          />
        </div>
        <div>
          <label
            htmlFor="doc-note"
            className="block text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Revision Note (optional)
          </label>
          <input
            id="doc-note"
            type="text"
            disabled={!canEdit}
            placeholder="e.g. Updated hero CTA copy"
            value={revisionNote}
            onChange={(e) => setRevisionNote(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand"
          />
        </div>
        <div className="sm:col-span-3">
          <label
            htmlFor="doc-excerpt"
            className="block text-xs font-semibold uppercase tracking-wider text-muted"
          >
            Excerpt / Summary
          </label>
          <input
            id="doc-excerpt"
            type="text"
            disabled={!canEdit}
            value={excerpt}
            onChange={(e) => {
              setExcerpt(e.target.value);
              markDirty();
            }}
            className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-brand"
          />
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
        <div role="tablist" aria-label="Editor views" className="flex flex-wrap gap-2">
          {[
            { id: "blocks", label: `Block Canvas (${blocks.length})`, icon: Sparkles },
            { id: "preview", label: "Responsive Preview", icon: Eye },
            {
              id: "seo",
              label: `SEO & Intelligence (${seoReport.overallScore}/100)`,
              icon: Search
            },
            { id: "revisions", label: `Revisions (${revisions.length})`, icon: History }
          ].map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setActiveTab(id as EditorTab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "bg-ink text-white"
                    : "border border-line bg-white text-muted hover:text-ink"
                }`}
              >
                <Icon size={15} aria-hidden="true" />
                {label}
              </button>
            );
          })}
        </div>

        {activeTab === "preview" ? (
          <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
            {[
              { id: "desktop", label: "Desktop", icon: Laptop },
              { id: "tablet", label: "Tablet", icon: Tablet },
              { id: "mobile", label: "Mobile", icon: Smartphone }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setViewport(id as ViewportSize)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  viewport === id
                    ? "bg-brand-soft font-semibold text-brand"
                    : "text-muted hover:text-ink"
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* TAB 1: BLOCK EDITOR & INSPECTOR */}
      {activeTab === "blocks" ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          {/* Left: Block List + Add Palette */}
          <div className="space-y-4">
            {blocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
                <p className="font-semibold">No blocks in this document yet</p>
                <p className="mt-1 text-sm text-muted">
                  Choose a block type from the palette below to start building your page.
                </p>
              </div>
            ) : (
              blocks.map((block, index) => {
                const isSelected = block.id === selectedBlockId;
                const spec = BLOCK_CATALOG[block.type];
                return (
                  <div
                    key={block.id}
                    onClick={() => setSelectedBlockId(block.id)}
                    className={`rounded-2xl border bg-white p-5 transition ${
                      isSelected
                        ? "border-brand ring-2 ring-brand/15"
                        : "border-line hover:border-brand/50"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand">
                          {spec?.label ?? block.type}
                        </span>
                        <span className="font-mono text-xs text-muted">#{index + 1}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!canEdit || index === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(index, -1);
                          }}
                          aria-label={`Move ${block.type} block up`}
                          className="rounded-lg border border-line p-1.5 text-muted hover:bg-canvas hover:text-ink disabled:opacity-35"
                        >
                          <ArrowUp size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={!canEdit || index === blocks.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBlock(index, 1);
                          }}
                          aria-label={`Move ${block.type} block down`}
                          className="rounded-lg border border-line p-1.5 text-muted hover:bg-canvas hover:text-ink disabled:opacity-35"
                        >
                          <ArrowDown size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateBlock(index);
                          }}
                          aria-label={`Duplicate ${block.type} block`}
                          className="rounded-lg border border-line p-1.5 text-muted hover:bg-canvas hover:text-ink disabled:opacity-35"
                        >
                          <Copy size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBlock(block.id);
                          }}
                          aria-label={`Remove ${block.type} block`}
                          className="rounded-lg border border-line p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-35"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Inline quick controls per block type */}
                    {block.type === "heading" ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          disabled={!canEdit}
                          aria-label="Heading text"
                          value={String(block.props.text ?? "")}
                          onChange={(e) => updateBlockProps(block.id, { text: e.target.value })}
                          className="w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-lg font-semibold text-ink"
                        />
                      </div>
                    ) : null}

                    {block.type === "paragraph" ? (
                      <textarea
                        rows={3}
                        disabled={!canEdit}
                        aria-label="Paragraph text"
                        value={String(block.props.text ?? "")}
                        onChange={(e) => updateBlockProps(block.id, { text: e.target.value })}
                        className="w-full rounded-xl border border-line bg-canvas p-3.5 text-sm leading-6 text-ink"
                      />
                    ) : null}

                    {block.type === "image" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-muted">Image URL</label>
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={String(block.props.url ?? "")}
                            onChange={(e) => updateBlockProps(block.id, { url: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted">
                            Alt Text (a11y & SEO)
                          </label>
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={String(block.props.alt ?? "")}
                            onChange={(e) => updateBlockProps(block.id, { alt: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                          />
                        </div>
                      </div>
                    ) : null}

                    {block.type === "button" ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-muted">
                            Button Label
                          </label>
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={String(block.props.label ?? "")}
                            onChange={(e) => updateBlockProps(block.id, { label: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-semibold text-ink"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted">
                            Destination URL
                          </label>
                          <input
                            type="text"
                            disabled={!canEdit}
                            value={String(block.props.href ?? "")}
                            onChange={(e) => updateBlockProps(block.id, { href: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                          />
                        </div>
                      </div>
                    ) : null}

                    {block.type === "callout" ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          disabled={!canEdit}
                          aria-label="Callout title"
                          value={String(block.props.title ?? "")}
                          onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
                          className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm font-semibold text-ink"
                        />
                        <textarea
                          rows={2}
                          disabled={!canEdit}
                          aria-label="Callout body"
                          value={String(block.props.text ?? "")}
                          onChange={(e) => updateBlockProps(block.id, { text: e.target.value })}
                          className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs leading-5 text-ink"
                        />
                      </div>
                    ) : null}

                    {block.type === "divider" ? (
                      <p className="text-xs text-muted">
                        Style: <strong>{String(block.props.style ?? "line")}</strong> · Spacing:{" "}
                        <strong>{String(block.props.spacing ?? "md")}</strong>
                      </p>
                    ) : null}

                    {block.type === "columns" ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {((block.props.items as ColumnsBlockItem[]) ?? []).map((col, cIdx) => (
                          <div key={cIdx} className="rounded-xl border border-line bg-canvas p-3">
                            <input
                              type="text"
                              disabled={!canEdit}
                              aria-label={`Column ${cIdx + 1} title`}
                              value={col.title}
                              onChange={(e) => {
                                const current = [
                                  ...((block.props.items as ColumnsBlockItem[]) ?? [])
                                ];
                                current[cIdx] = { ...current[cIdx], title: e.target.value };
                                updateBlockProps(block.id, { items: current });
                              }}
                              className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold"
                            />
                            <textarea
                              rows={2}
                              disabled={!canEdit}
                              aria-label={`Column ${cIdx + 1} body`}
                              value={col.body}
                              onChange={(e) => {
                                const current = [
                                  ...((block.props.items as ColumnsBlockItem[]) ?? [])
                                ];
                                current[cIdx] = { ...current[cIdx], body: e.target.value };
                                updateBlockProps(block.id, { items: current });
                              }}
                              className="mt-1.5 w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {block.type === "faq" ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          disabled={!canEdit}
                          aria-label="FAQ section heading"
                          value={String(block.props.title ?? "Frequently Asked Questions")}
                          onChange={(e) => updateBlockProps(block.id, { title: e.target.value })}
                          className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm font-semibold text-ink"
                        />
                        <div className="space-y-2">
                          {((block.props.items as FaqBlockItem[]) ?? []).map((faqItem, fIdx) => (
                            <div
                              key={fIdx}
                              className="rounded-xl border border-line bg-canvas p-3"
                            >
                              <input
                                type="text"
                                disabled={!canEdit}
                                aria-label={`FAQ Question ${fIdx + 1}`}
                                value={faqItem.question}
                                onChange={(e) => {
                                  const current = [
                                    ...((block.props.items as FaqBlockItem[]) ?? [])
                                  ];
                                  current[fIdx] = {
                                    ...current[fIdx],
                                    question: e.target.value
                                  };
                                  updateBlockProps(block.id, { items: current });
                                }}
                                className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink"
                              />
                              <textarea
                                rows={2}
                                disabled={!canEdit}
                                aria-label={`FAQ Answer ${fIdx + 1}`}
                                value={faqItem.answer}
                                onChange={(e) => {
                                  const current = [
                                    ...((block.props.items as FaqBlockItem[]) ?? [])
                                  ];
                                  current[fIdx] = { ...current[fIdx], answer: e.target.value };
                                  updateBlockProps(block.id, { items: current });
                                }}
                                className="mt-1.5 w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs text-muted"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}

            {/* Add Block Palette */}
            <section className="rounded-2xl border border-line bg-white p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Add Registered Block
              </h3>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {REGISTERED_BLOCK_TYPES.map((type) => {
                  const spec = BLOCK_CATALOG[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={!canEdit}
                      onClick={() => addBlock(type)}
                      className="flex flex-col items-start rounded-xl border border-line bg-canvas p-3.5 text-left transition hover:border-brand hover:bg-brand-soft/40 disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <Plus size={14} className="text-brand" aria-hidden="true" />
                        {spec.label}
                      </span>
                      <span className="mt-1 text-xs leading-4 text-muted">{spec.description}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right: Block Property Inspector */}
          <aside className="h-fit rounded-2xl border border-line bg-white p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
              Block Inspector
            </h3>
            {!selectedBlock ? (
              <p className="mt-3 text-sm text-muted">
                Select any block on the canvas to configure its layout and properties.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="font-semibold text-ink">
                    {BLOCK_CATALOG[selectedBlock.type]?.label}
                  </span>
                  <span className="font-mono text-xs text-muted">{selectedBlock.id}</span>
                </div>

                {selectedBlock.type === "heading" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted">
                        Heading Level
                      </label>
                      <select
                        disabled={!canEdit}
                        value={Number(selectedBlock.props.level ?? 2)}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { level: Number(e.target.value) })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value={1}>H1 — Page Hero Title</option>
                        <option value={2}>H2 — Section Heading</option>
                        <option value={3}>H3 — Sub-section Heading</option>
                        <option value={4}>H4 — Minor Heading</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted">
                        Text Alignment
                      </label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.align ?? "left")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { align: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </>
                ) : null}

                {selectedBlock.type === "paragraph" ? (
                  <>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={Boolean(selectedBlock.props.lead)}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { lead: e.target.checked })
                        }
                      />
                      <span>Lead paragraph (larger editorial font)</span>
                    </label>
                    <div>
                      <label className="block text-xs font-semibold text-muted">Alignment</label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.align ?? "left")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { align: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </>
                ) : null}

                {selectedBlock.type === "image" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted">
                        Choose from Media Library
                      </label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.mediaId ?? "")}
                        onChange={(e) => {
                          const asset = mediaAssets.find((m) => m.id === e.target.value);
                          if (asset) {
                            updateBlockProps(selectedBlock.id, {
                              mediaId: asset.id,
                              url: asset.url,
                              alt: asset.altText || asset.filename,
                              caption: asset.caption
                            });
                          }
                        }}
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="">Custom URL / Select asset...</option>
                        {mediaAssets.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.filename} ({m.altText || "No alt"})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted">Caption</label>
                      <input
                        type="text"
                        disabled={!canEdit}
                        value={String(selectedBlock.props.caption ?? "")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { caption: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted">Aspect Ratio</label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.aspectRatio ?? "16:9")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { aspectRatio: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="16:9">16:9 Widescreen</option>
                        <option value="4:3">4:3 Standard</option>
                        <option value="1:1">1:1 Square</option>
                        <option value="auto">Auto / Intrinsic</option>
                      </select>
                    </div>
                  </>
                ) : null}

                {selectedBlock.type === "button" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted">Button Style</label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.variant ?? "primary")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { variant: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="primary">Primary (Brand Green)</option>
                        <option value="secondary">Secondary (Dark Ink)</option>
                        <option value="outline">Outline</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted">Alignment</label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.align ?? "left")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { align: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </>
                ) : null}

                {selectedBlock.type === "divider" ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-muted">
                        Divider Style
                      </label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.style ?? "line")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { style: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="line">Horizontal rule line</option>
                        <option value="dots">Editorial dots (•••)</option>
                        <option value="space">Blank vertical spacer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted">
                        Vertical Spacing
                      </label>
                      <select
                        disabled={!canEdit}
                        value={String(selectedBlock.props.spacing ?? "md")}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { spacing: e.target.value })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                      </select>
                    </div>
                  </>
                ) : null}

                {selectedBlock.type === "callout" ? (
                  <div>
                    <label className="block text-xs font-semibold text-muted">Callout Tone</label>
                    <select
                      disabled={!canEdit}
                      value={String(selectedBlock.props.tone ?? "brand")}
                      onChange={(e) =>
                        updateBlockProps(selectedBlock.id, { tone: e.target.value })
                      }
                      className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                    >
                      <option value="brand">Brand Highlight (Green)</option>
                      <option value="info">Neutral Info (Canvas)</option>
                      <option value="warning">Editorial Notice (Amber)</option>
                    </select>
                  </div>
                ) : null}

                {selectedBlock.type === "columns" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted">Grid Columns</label>
                      <select
                        disabled={!canEdit}
                        value={Number(selectedBlock.props.columns ?? 2)}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { columns: Number(e.target.value) })
                        }
                        className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
                      >
                        <option value={2}>2 Columns</option>
                        <option value={3}>3 Columns</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        const current = [
                          ...((selectedBlock.props.items as ColumnsBlockItem[]) ?? [])
                        ];
                        if (current.length < 6) {
                          current.push({ title: "New column", body: "Column description." });
                          updateBlockProps(selectedBlock.id, { items: current });
                        }
                      }}
                      className="w-full rounded-xl border border-line bg-canvas py-2 text-xs font-semibold text-ink hover:border-brand"
                    >
                      + Add Column Item
                    </button>
                  </div>
                ) : null}

                {selectedBlock.type === "faq" ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-semibold text-ink">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={Boolean(selectedBlock.props.exclusive ?? true)}
                        onChange={(e) =>
                          updateBlockProps(selectedBlock.id, { exclusive: e.target.checked })
                        }
                      />
                      Exclusive accordion (shared HTML <code>name</code> attribute)
                    </label>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => {
                        const current = [...((selectedBlock.props.items as FaqBlockItem[]) ?? [])];
                        if (current.length < 15) {
                          current.push({
                            question: "New Frequently Asked Question?",
                            answer: "Clear, concise answer for readers and FAQPage Schema.org."
                          });
                          updateBlockProps(selectedBlock.id, { items: current });
                        }
                      }}
                      className="w-full rounded-xl border border-line bg-canvas py-2 text-xs font-semibold text-ink hover:border-brand"
                    >
                      + Add FAQ Question/Answer Pair
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {/* TAB 2: LIVE RESPONSIVE PREVIEW */}
      {activeTab === "preview" ? (
        <div className="rounded-2xl border border-line bg-canvas p-6">
          <div
            className={`mx-auto rounded-2xl border border-line bg-white p-8 shadow-soft transition-all ${
              viewport === "mobile"
                ? "max-w-[390px]"
                : viewport === "tablet"
                  ? "max-w-[768px]"
                  : "max-w-4xl"
            }`}
          >
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4 text-xs text-muted">
              <span>
                Canvas Preview ({viewport.toUpperCase()}) · Schema v{item.document.schemaVersion}
              </span>
              <span className="font-mono">{publicUrl}</span>
            </div>
            <BlockDocumentRenderer
              document={{
                schemaVersion: item.document.schemaVersion,
                blocks
              }}
            />
          </div>
        </div>
      ) : null}

      {/* TAB 3: BUILT-IN RANK MATH + YOAST + AIOSEO SUITE */}
      {activeTab === "seo" ? (
        <div className="space-y-6">
          {/* Score Bar: TruSEO Score + Readability Traffic Light + Cornerstone Toggle */}
          <div className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-4">
            <div className="rounded-2xl border border-line bg-canvas p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                TruSEO & Content Score
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-ink">
                  {seoReport.overallScore}/100
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBadgeClass}`}>
                  {seoReport.status === "good"
                    ? "Good"
                    : seoReport.status === "ok"
                      ? "Needs Improvement"
                      : "Needs Work"}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-canvas p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Yoast Readability Analysis
              </p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl font-semibold capitalize text-ink">
                  {seoReport.readabilityStatus}
                </span>
                <span className="text-xs font-normal text-muted">
                  ({seoReport.stats.sentenceCount} sentences)
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-canvas p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Keyword Density & Volume
              </p>
              <p className="mt-1.5 text-2xl font-semibold text-ink">
                {seoReport.stats.keywordDensityPercent}%{" "}
                <span className="text-xs font-normal text-muted">
                  ({seoReport.stats.keywordCount} matches)
                </span>
              </p>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-line bg-canvas p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Cornerstone Content
                </span>
                <Star size={14} className="text-warning" />
              </div>
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  disabled={!canEdit}
                  checked={Boolean(seo.isCornerstone)}
                  onChange={(e) => {
                    setSeo((prev) => ({ ...prev, isCornerstone: e.target.checked }));
                    markDirty();
                  }}
                />
                <span>Mark as Cornerstone Pillar Content</span>
              </label>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            {/* Left Column: Keywords, Smart Tags, Meta Fields, Schema, Robots */}
            <div className="space-y-6">
              {/* Focus & Secondary Keywords */}
              <section className="space-y-4 rounded-2xl border border-line bg-white p-6">
                <h3 className="text-base font-semibold text-ink">
                  Focus Keyword & Smart Tag Metadata
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="seo-focus-kw"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      Primary Focus Keyword
                    </label>
                    <input
                      id="seo-focus-kw"
                      type="text"
                      disabled={!canEdit}
                      placeholder="e.g. block registry"
                      value={seo.focusKeyword ?? ""}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, focusKeyword: e.target.value }));
                        markDirty();
                      }}
                      className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm font-medium text-ink"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="seo-sec-kw"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      Secondary Keywords (comma-separated)
                    </label>
                    <input
                      id="seo-sec-kw"
                      type="text"
                      disabled={!canEdit}
                      placeholder="nextpress, schema, react"
                      value={secondaryKeywordsInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSecondaryKeywordsInput(val);
                        setSeo((prev) => ({
                          ...prev,
                          secondaryKeywords: val
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean)
                        }));
                        markDirty();
                      }}
                      className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink"
                    />
                  </div>
                </div>

                {/* Smart Tag Quick Insert */}
                <div>
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Insert Smart Tag Variable into SEO Title
                  </span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {SMART_TAGS.map((t) => (
                      <button
                        key={t.tag}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => {
                          setSeo((prev) => ({
                            ...prev,
                            metaTitle: `${(prev.metaTitle ?? title).trim()} ${t.tag}`.trim()
                          }));
                          markDirty();
                        }}
                        className="rounded-lg border border-line bg-canvas px-2.5 py-1 font-mono text-[11px] text-brand hover:border-brand"
                      >
                        + {t.tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="seo-title"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted"
                  >
                    SEO Title ({seoReport.resolvedTitle.length}/60 chars)
                  </label>
                  <input
                    id="seo-title"
                    type="text"
                    disabled={!canEdit}
                    value={seo.metaTitle ?? ""}
                    placeholder="%%title%% %%sep%% %%sitename%%"
                    onChange={(e) => {
                      setSeo((prev) => ({ ...prev, metaTitle: e.target.value }));
                      markDirty();
                    }}
                    className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="seo-desc"
                    className="block text-xs font-semibold uppercase tracking-wider text-muted"
                  >
                    Meta Description ({seoReport.resolvedDescription.length}/160 chars)
                  </label>
                  <textarea
                    id="seo-desc"
                    rows={3}
                    disabled={!canEdit}
                    value={seo.metaDescription ?? ""}
                    placeholder={
                      excerpt || "Brief summary for Google SERP snippets and social cards."
                    }
                    onChange={(e) => {
                      setSeo((prev) => ({ ...prev, metaDescription: e.target.value }));
                      markDirty();
                    }}
                    className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="seo-canon"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      Canonical URL
                    </label>
                    <input
                      id="seo-canon"
                      type="url"
                      disabled={!canEdit}
                      value={seo.canonicalUrl ?? ""}
                      placeholder={`http://localhost:3000${publicUrl}`}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, canonicalUrl: e.target.value }));
                        markDirty();
                      }}
                      className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="seo-schema"
                      className="block text-xs font-semibold uppercase tracking-wider text-muted"
                    >
                      Schema.org Entity Type (@graph)
                    </label>
                    <select
                      id="seo-schema"
                      disabled={!canEdit}
                      value={seo.schemaType ?? (item.kind === "post" ? "BlogPosting" : "WebPage")}
                      onChange={(e) => {
                        setSeo((prev) => ({
                          ...prev,
                          schemaType: e.target.value as SchemaEntityType
                        }));
                        markDirty();
                      }}
                      className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-semibold text-ink"
                    >
                      {SCHEMA_ENTITY_TYPES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Advanced Robots Directives */}
                <div className="border-t border-line pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Advanced Robots Meta Directives
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-4 text-xs font-medium text-ink">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={Boolean(seo.noIndex)}
                        onChange={(e) => {
                          setSeo((prev) => ({ ...prev, noIndex: e.target.checked }));
                          markDirty();
                        }}
                      />
                      <code>noindex</code>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={Boolean(seo.noFollow)}
                        onChange={(e) => {
                          setSeo((prev) => ({ ...prev, noFollow: e.target.checked }));
                          markDirty();
                        }}
                      />
                      <code>nofollow</code>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={Boolean(seo.noArchive)}
                        onChange={(e) => {
                          setSeo((prev) => ({ ...prev, noArchive: e.target.checked }));
                          markDirty();
                        }}
                      />
                      <code>noarchive</code>
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={Boolean(seo.noSnippet)}
                        onChange={(e) => {
                          setSeo((prev) => ({ ...prev, noSnippet: e.target.checked }));
                          markDirty();
                        }}
                      />
                      <code>nosnippet</code>
                    </label>
                  </div>
                </div>
              </section>

              {/* Actionable 15-Check SEO & Readability Checklist */}
              <section className="rounded-2xl border border-line bg-white p-6">
                <h3 className="text-base font-semibold text-ink">
                  Actionable SEO & Readability Checklist ({seoReport.checks.length} Checks)
                </h3>
                <div className="mt-4 space-y-2.5">
                  {seoReport.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas p-3"
                    >
                      <div className="flex items-start gap-2.5">
                        {chk.status === "pass" ? (
                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0 text-success"
                            aria-hidden="true"
                          />
                        ) : chk.status === "warn" ? (
                          <AlertTriangle
                            size={16}
                            className="mt-0.5 shrink-0 text-warning"
                            aria-hidden="true"
                          />
                        ) : (
                          <AlertCircle
                            size={16}
                            className="mt-0.5 shrink-0 text-danger"
                            aria-hidden="true"
                          />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-ink">{chk.label}</p>
                          <p className="mt-0.5 text-xs text-muted">{chk.detail}</p>
                        </div>
                      </div>
                      <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
                        {chk.category}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Live SERP Preview, Social Card, Schema @graph JSON-LD, Internal Links, Taxonomies */}
            <div className="space-y-6">
              {/* Interactive Google SERP & Social Card Preview */}
              <section className="rounded-2xl border border-line bg-white p-6">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-ink">Google SERP Snippet Preview</h3>
                  <div className="flex rounded-lg border border-line bg-canvas p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSerpDevice("desktop")}
                      className={`rounded-md px-2.5 py-1 font-semibold ${
                        serpDevice === "desktop" ? "bg-white text-ink shadow-2xs" : "text-muted"
                      }`}
                    >
                      Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setSerpDevice("mobile")}
                      className={`rounded-md px-2.5 py-1 font-semibold ${
                        serpDevice === "mobile" ? "bg-white text-ink shadow-2xs" : "text-muted"
                      }`}
                    >
                      Mobile
                    </button>
                  </div>
                </div>

                <div
                  className={`mt-3 rounded-2xl border border-line bg-white p-4 shadow-2xs ${
                    serpDevice === "mobile" ? "max-w-[360px]" : ""
                  }`}
                >
                  <p className="truncate text-xs text-[#202124]">
                    {effectiveSite.domain || "localhost:3000"} › s › {siteSlug} › {slug}
                  </p>
                  <p className="mt-1 line-clamp-1 text-lg font-medium text-[#1a0dab] hover:underline">
                    {seoReport.resolvedTitle}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#4d5156]">
                    {seoReport.resolvedDescription ||
                      "Add a meta description to control how this page appears in Google Search results."}
                  </p>
                </div>

                {/* Social Card Inputs */}
                <div className="mt-4 border-t border-line pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Share2 size={14} className="text-brand" />
                    <span>Open Graph & X/Twitter Card Overrides</span>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="Custom Open Graph Title"
                      value={seo.ogTitle ?? ""}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, ogTitle: e.target.value }));
                        markDirty();
                      }}
                      className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                    />
                    <input
                      type="text"
                      disabled={!canEdit}
                      placeholder="OG Image URL (/nextpress-mark.svg)"
                      value={seo.ogImage ?? ""}
                      onChange={(e) => {
                        setSeo((prev) => ({ ...prev, ogImage: e.target.value }));
                        markDirty();
                      }}
                      className="rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                    />
                  </div>
                </div>

                {/* Schema.org JSON-LD @graph Inspector */}
                <div className="mt-4 border-t border-line pt-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                      <Code2 size={14} className="text-brand" />
                      Unified Schema.org JSON-LD <code>@graph</code>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSchemaJson(!showSchemaJson)}
                      className="rounded-lg border border-line bg-canvas px-2.5 py-1 text-[11px] font-semibold text-brand"
                    >
                      {showSchemaJson ? "Hide JSON-LD" : "Inspect JSON-LD"}
                    </button>
                  </div>
                  {showSchemaJson ? (
                    <pre className="mt-2.5 max-h-60 overflow-auto rounded-xl bg-[#111715] p-3 font-mono text-[11px] leading-5 text-[#E6ECE9]">
                      {JSON.stringify(schemaGraph, null, 2)}
                    </pre>
                  ) : null}
                </div>
              </section>

              {/* Internal Linking Suggestions (Yoast / AIOSEO Link Assistant) */}
              <section className="rounded-2xl border border-line bg-white p-6">
                <div className="flex items-center gap-2">
                  <Link2 size={16} className="text-brand" />
                  <h3 className="text-base font-semibold text-ink">
                    Internal Link Assistant
                  </h3>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Suggested Cornerstone & related pages on this site you have not linked to yet.
                </p>

                <div className="mt-3 space-y-2.5">
                  {internalLinkSuggestions.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line p-4 text-xs text-muted">
                      Great job! This document already links to your key pages.
                    </p>
                  ) : (
                    internalLinkSuggestions.map((sug) => (
                      <div
                        key={sug.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas p-3"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-ink">{sug.title}</span>
                            {sug.isCornerstone ? (
                              <span className="rounded bg-[#F8EBD9] px-1.5 py-0.5 text-[10px] font-semibold text-warning">
                                ★ Cornerstone
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-0.5 font-mono text-[11px] text-muted">
                            {sug.publicPath} · {sug.relevanceReason}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => insertInternalLinkBlock(sug.publicPath, sug.title)}
                          className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-brand hover:border-brand"
                        >
                          {sug.alreadyLinked ? "Linked ✓" : "+ Insert Link"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Categories & Tags */}
              <section className="space-y-3 rounded-2xl border border-line bg-white p-6">
                <h3 className="text-base font-semibold">Categories & Tags</h3>
                <div className="space-y-2">
                  {taxonomies.map((tax) => {
                    const checked = selectedTaxonomies.includes(tax.id);
                    return (
                      <label
                        key={tax.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 text-sm transition ${
                          checked ? "border-brand bg-brand-soft/40" : "border-line bg-canvas"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            disabled={!canEdit}
                            checked={checked}
                            onChange={() => toggleTaxonomy(tax.id)}
                          />
                          <span className="font-medium">{tax.name}</span>
                        </div>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs uppercase text-muted">
                          {tax.type}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {/* TAB 4: REVISION HISTORY */}
      {activeTab === "revisions" ? (
        <section className="rounded-2xl border border-line bg-white">
          <div className="border-b border-line px-6 py-4">
            <h3 className="text-base font-semibold">Versioned Revision History</h3>
            <p className="mt-1 text-xs text-muted">
              Every save creates an immutable snapshot of your blocks and SEO metadata so you can
              recover earlier work safely.
            </p>
          </div>
          <div className="divide-y divide-line">
            {revisions.map((rev) => (
              <div
                key={rev.id}
                className="flex flex-col justify-between gap-3 px-6 py-4 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-lg bg-brand-soft px-2.5 py-1 font-mono text-xs font-semibold text-brand">
                      v{rev.version}
                    </span>
                    <span className="font-medium text-ink">{rev.title}</span>
                    <span className="text-xs text-muted">by {rev.authorName}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {rev.note || "Saved snapshot"} · {rev.document.blocks.length} blocks ·{" "}
                    {new Date(rev.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!canEdit || isPending}
                  onClick={() => handleRestoreRevision(rev)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  Restore v{rev.version}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
