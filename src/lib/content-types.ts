/**
 * Canonical content document schema, block registry types, and runtime validators
 * for NextPress.js.
 */

export const CURRENT_DOCUMENT_SCHEMA_VERSION = 1;

export type ContentStatus = "draft" | "published" | "scheduled" | "archived";
export type ContentKind = "page" | "post";
export type SiteRole = "owner" | "admin" | "editor" | "author";

export type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "button"
  | "divider"
  | "callout"
  | "columns";

export type TextAlign = "left" | "center" | "right";

export type HeadingBlockProps = {
  text: string;
  level: 1 | 2 | 3 | 4;
  align?: TextAlign;
};

export type ParagraphBlockProps = {
  text: string;
  align?: TextAlign;
  lead?: boolean;
};

export type ImageBlockProps = {
  url: string;
  alt: string;
  caption?: string;
  aspectRatio?: "auto" | "16:9" | "4:3" | "1:1";
  mediaId?: string;
};

export type ButtonBlockProps = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "outline";
  align?: TextAlign;
};

export type DividerBlockProps = {
  style?: "line" | "space" | "dots";
  spacing?: "sm" | "md" | "lg";
};

export type CalloutBlockProps = {
  title: string;
  text: string;
  tone?: "brand" | "info" | "warning";
};

export type ColumnsBlockItem = {
  title: string;
  body: string;
};

export type ColumnsBlockProps = {
  columns: 2 | 3;
  items: ColumnsBlockItem[];
};

export type ContentBlock = {
  id: string;
  type: BlockType;
  version: number;
  props: Record<string, unknown>;
  children?: ContentBlock[];
};

export type ContentDocument = {
  schemaVersion: number;
  blocks: ContentBlock[];
};

export type SeoMetadata = {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
};

export type ThemeSettings = {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  headingFont: "system" | "serif" | "mono";
  bodyFont: "system" | "serif";
  borderRadius: "sharp" | "rounded" | "pill";
};

export type ContentSummary = {
  id: string;
  siteId: string;
  kind: ContentKind;
  title: string;
  slug: string;
  excerpt: string;
  status: ContentStatus;
  authorId: string;
  authorName: string;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export type ContentItemRecord = ContentSummary & {
  document: ContentDocument;
  publishedDocument: ContentDocument | null;
  seo: SeoMetadata;
  scheduledFor: string | null;
  taxonomyIds: string[];
};

export type RevisionRecord = {
  id: string;
  contentId: string;
  siteId: string;
  version: number;
  title: string;
  slug: string;
  document: ContentDocument;
  seo: SeoMetadata;
  note: string;
  authorId: string;
  authorName: string;
  createdAt: string;
};

export type MediaAssetRecord = {
  id: string;
  siteId: string;
  filename: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  altText: string;
  caption: string;
  uploadedBy: string;
  createdAt: string;
};

export type TaxonomyRecord = {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  type: "category" | "tag";
  description: string;
  createdAt: string;
};

export type SiteRecord = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  tagline: string;
  description: string;
  ownerId: string;
  themeSettings: ThemeSettings;
  seoDefaults: SeoMetadata;
  createdAt: string;
  updatedAt: string;
};

export const REGISTERED_BLOCK_TYPES: readonly BlockType[] = [
  "heading",
  "paragraph",
  "image",
  "button",
  "divider",
  "callout",
  "columns"
] as const;

export const BLOCK_CATALOG: Record<
  BlockType,
  { label: string; description: string; defaultProps: Record<string, unknown> }
> = {
  heading: {
    label: "Heading",
    description: "Section title (H1–H4) with balanced line wrapping.",
    defaultProps: { text: "Section heading", level: 2, align: "left" }
  },
  paragraph: {
    label: "Paragraph",
    description: "Rich body copy paragraph with optional lead styling.",
    defaultProps: {
      text: "Write clear, structured content that renders consistently across your site.",
      align: "left",
      lead: false
    }
  },
  image: {
    label: "Image",
    description: "Responsive figure with alt text, aspect ratio, and caption.",
    defaultProps: {
      url: "/nextpress-mark.svg",
      alt: "NextPress graphic",
      caption: "",
      aspectRatio: "16:9"
    }
  },
  button: {
    label: "Button / Link",
    description: "Call-to-action link button with validated destination URL.",
    defaultProps: {
      label: "Learn more",
      href: "/",
      variant: "primary",
      align: "left"
    }
  },
  divider: {
    label: "Divider / Spacer",
    description: "Horizontal visual separator or vertical rhythm spacer.",
    defaultProps: { style: "line", spacing: "md" }
  },
  callout: {
    label: "Callout Box",
    description: "Highlighted editorial note, tip, or announcement banner.",
    defaultProps: {
      title: "Key takeaway",
      text: "Highlight important context for your readers.",
      tone: "brand"
    }
  },
  columns: {
    label: "Feature Columns",
    description: "2- or 3-column structured grid for features or highlights.",
    defaultProps: {
      columns: 2,
      items: [
        { title: "Structured schema", body: "Every block is validated before saving and rendering." },
        { title: "Fast public pages", body: "Published routes ship clean HTML without editor overhead." }
      ]
    }
  }
};

/**
 * Sanitizes a user-provided URL to prevent XSS via javascript:, data:, or vbscript: URIs.
 */
export function sanitizeUrl(raw: unknown, fallback = "#"): string {
  if (typeof raw !== "string") return fallback;
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:")
  ) {
    return trimmed;
  }
  return fallback;
}

/**
 * Normalizes a string into a URL-safe slug.
 */
export function normalizeSlug(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "untitled";
}

function clampText(val: unknown, maxLen = 10000, fallback = ""): string {
  if (typeof val !== "string") return fallback;
  return val.slice(0, maxLen);
}

function normalizeAlign(val: unknown): TextAlign {
  if (val === "center" || val === "right") return val;
  return "left";
}

export function createDefaultBlock(type: BlockType, customId?: string): ContentBlock {
  const spec = BLOCK_CATALOG[type] ?? BLOCK_CATALOG.paragraph;
  return {
    id: customId ?? `blk_${Math.random().toString(36).slice(2, 10)}`,
    type,
    version: 1,
    props: structuredClone(spec.defaultProps)
  };
}

/**
 * Validates and normalizes an individual block against the registered block schema.
 * Rejects unknown block types and strips unsafe properties.
 */
export function validateAndNormalizeBlock(raw: unknown): {
  valid: boolean;
  block?: ContentBlock;
  error?: string;
} {
  if (!raw || typeof raw !== "object") {
    return { valid: false, error: "Block must be an object." };
  }
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === "string" && obj.id.trim() ? obj.id.trim().slice(0, 64) : `blk_${Math.random().toString(36).slice(2, 10)}`;
  const type = obj.type as BlockType;

  if (!REGISTERED_BLOCK_TYPES.includes(type)) {
    return { valid: false, error: `Unregistered block type: ${String(obj.type)}` };
  }

  const rawProps = (obj.props && typeof obj.props === "object" ? obj.props : {}) as Record<string, unknown>;
  let normalizedProps: Record<string, unknown> = {};

  switch (type) {
    case "heading": {
      const rawLevel = Number(rawProps.level);
      const level = rawLevel === 1 || rawLevel === 2 || rawLevel === 3 || rawLevel === 4 ? rawLevel : 2;
      normalizedProps = {
        text: clampText(rawProps.text, 500, "Untitled heading"),
        level,
        align: normalizeAlign(rawProps.align)
      };
      break;
    }
    case "paragraph": {
      normalizedProps = {
        text: clampText(rawProps.text, 20000, ""),
        align: normalizeAlign(rawProps.align),
        lead: Boolean(rawProps.lead)
      };
      break;
    }
    case "image": {
      const ratio = rawProps.aspectRatio;
      const aspectRatio =
        ratio === "16:9" || ratio === "4:3" || ratio === "1:1" || ratio === "auto" ? ratio : "16:9";
      normalizedProps = {
        url: sanitizeUrl(rawProps.url, "/nextpress-mark.svg"),
        alt: clampText(rawProps.alt, 500, ""),
        caption: clampText(rawProps.caption, 500, ""),
        aspectRatio,
        ...(typeof rawProps.mediaId === "string" ? { mediaId: rawProps.mediaId.slice(0, 64) } : {})
      };
      break;
    }
    case "button": {
      const v = rawProps.variant;
      const variant = v === "secondary" || v === "outline" ? v : "primary";
      normalizedProps = {
        label: clampText(rawProps.label, 120, "Learn more"),
        href: sanitizeUrl(rawProps.href, "#"),
        variant,
        align: normalizeAlign(rawProps.align)
      };
      break;
    }
    case "divider": {
      const s = rawProps.style;
      const style = s === "space" || s === "dots" ? s : "line";
      const sp = rawProps.spacing;
      const spacing = sp === "sm" || sp === "lg" ? sp : "md";
      normalizedProps = { style, spacing };
      break;
    }
    case "callout": {
      const t = rawProps.tone;
      const tone = t === "info" || t === "warning" ? t : "brand";
      normalizedProps = {
        title: clampText(rawProps.title, 200, "Note"),
        text: clampText(rawProps.text, 4000, ""),
        tone
      };
      break;
    }
    case "columns": {
      const cols = Number(rawProps.columns) === 3 ? 3 : 2;
      const rawItems = Array.isArray(rawProps.items) ? rawProps.items : [];
      const items: ColumnsBlockItem[] = rawItems.slice(0, 6).map((item) => {
        const it = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        return {
          title: clampText(it.title, 200, "Feature"),
          body: clampText(it.body, 2000, "")
        };
      });
      normalizedProps = {
        columns: cols,
        items: items.length > 0 ? items : BLOCK_CATALOG.columns.defaultProps.items
      };
      break;
    }
  }

  return {
    valid: true,
    block: {
      id,
      type,
      version: typeof obj.version === "number" && obj.version >= 1 ? Math.floor(obj.version) : 1,
      props: normalizedProps
    }
  };
}

/**
 * Validates and migrates a ContentDocument to CURRENT_DOCUMENT_SCHEMA_VERSION.
 */
export function validateAndMigrateDocument(raw: unknown): {
  valid: boolean;
  document: ContentDocument;
  errors: string[];
} {
  if (!raw || typeof raw !== "object") {
    return {
      valid: false,
      document: { schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION, blocks: [] },
      errors: ["Document must be a JSON object."]
    };
  }

  const obj = raw as Record<string, unknown>;
  const rawBlocks = Array.isArray(obj.blocks) ? obj.blocks : [];
  const errors: string[] = [];
  const validBlocks: ContentBlock[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const res = validateAndNormalizeBlock(rawBlocks[i]);
    if (res.valid && res.block) {
      validBlocks.push(res.block);
    } else {
      errors.push(`Block [${i}]: ${res.error ?? "Invalid block"}`);
    }
  }

  return {
    valid: errors.length === 0,
    document: {
      schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
      blocks: validBlocks
    },
    errors
  };
}

export function validateSeoMetadata(raw: unknown): SeoMetadata {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return {
    metaTitle: clampText(obj.metaTitle, 160, ""),
    metaDescription: clampText(obj.metaDescription, 320, ""),
    canonicalUrl: obj.canonicalUrl ? sanitizeUrl(obj.canonicalUrl, "") : "",
    ogImage: obj.ogImage ? sanitizeUrl(obj.ogImage, "") : "",
    noIndex: Boolean(obj.noIndex)
  };
}
