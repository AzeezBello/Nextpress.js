/**
 * NextPress.js Native SEO & Content Intelligence Engine
 *
 * Synthesizes and reverse-engineers core capabilities from:
 * - Rank Math (0–100 SEO score, Focus/Secondary Keyword tests, Power words, Redirections & 404 Monitor, Schema types)
 * - Yoast SEO (Traffic-light Readability analysis, Cornerstone content strict mode, Unified Schema.org @graph, Internal linking suggestions)
 * - All in One SEO / AIOSEO (TruSEO actionable checklist, Smart Tags %%variables%%, Social Previews, Local Business Schema, Custom robots.txt)
 */

import type {
  ButtonBlockProps,
  CalloutBlockProps,
  ColumnsBlockProps,
  ContentDocument,
  ContentKind,
  ContentSummary,
  FaqBlockItem,
  FaqBlockProps,
  HeadingBlockProps,
  ImageBlockProps,
  ParagraphBlockProps,
  SeoMetadata,
  SiteRecord
} from "@/lib/content-types";

export const SMART_TAGS: ReadonlyArray<{
  tag: string;
  label: string;
  description: string;
}> = [
  { tag: "%%title%%", label: "Title", description: "Current page or post title" },
  { tag: "%%sitename%%", label: "Site Name", description: "Active site title" },
  { tag: "%%tagline%%", label: "Tagline", description: "Site tagline" },
  { tag: "%%sep%%", label: "Separator", description: "Configured title separator" },
  { tag: "%%excerpt%%", label: "Excerpt", description: "Content summary or lead copy" },
  { tag: "%%author%%", label: "Author", description: "Content author display name" },
  { tag: "%%current_year%%", label: "Year", description: "Current 4-digit year" },
  { tag: "%%focuskw%%", label: "Focus Keyword", description: "Primary target keyword" }
] as const;

export type SmartTagContext = {
  title: string;
  siteName: string;
  tagline?: string;
  separator?: string;
  excerpt?: string;
  authorName?: string;
  focusKeyword?: string;
  currentYear?: string;
};

/**
 * Resolves AIOSEO / Yoast style %%smart_tags%% into concrete strings.
 */
export function resolveSmartTags(template: string | undefined, ctx: SmartTagContext): string {
  const raw = (template ?? "").trim();
  if (!raw) return "";

  const sep = (ctx.separator || "|").trim();
  const year = ctx.currentYear || String(new Date().getFullYear());

  return raw
    .replace(/%%title%%/gi, ctx.title || "Untitled")
    .replace(/%%sitename%%/gi, ctx.siteName || "NextPress")
    .replace(/%%tagline%%/gi, ctx.tagline || "")
    .replace(/%%sep%%/gi, sep)
    .replace(/%%excerpt%%/gi, ctx.excerpt || "")
    .replace(/%%author%%/gi, ctx.authorName || "Editorial Team")
    .replace(/%%current_year%%/gi, year)
    .replace(/%%focuskw%%/gi, ctx.focusKeyword || "")
    .replace(/\s+/g, " ")
    .trim();
}

export type SeoCheckCategory = "basic" | "additional" | "title" | "readability";
export type SeoCheckStatus = "pass" | "warn" | "fail";
export type TrafficLight = "good" | "ok" | "needs-work";

export type SeoCheckResult = {
  id: string;
  category: SeoCheckCategory;
  label: string;
  status: SeoCheckStatus;
  detail: string;
  points: number;
  maxPoints: number;
};

export type ContentSeoAnalysis = {
  overallScore: number;
  status: TrafficLight;
  readabilityStatus: TrafficLight;
  resolvedTitle: string;
  resolvedDescription: string;
  stats: {
    wordCount: number;
    readingTimeMinutes: number;
    sentenceCount: number;
    paragraphCount: number;
    headingCount: number;
    imageCount: number;
    imagesWithAlt: number;
    internalLinkCount: number;
    externalLinkCount: number;
    keywordCount: number;
    keywordDensityPercent: number;
    transitionSentenceRatio: number;
    passiveSentenceRatio: number;
    longSentenceRatio: number;
  };
  checks: SeoCheckResult[];
};

const TRANSITION_WORDS = [
  "however",
  "therefore",
  "furthermore",
  "moreover",
  "consequently",
  "for example",
  "for instance",
  "in addition",
  "specifically",
  "because",
  "although",
  "meanwhile",
  "nonetheless",
  "as a result",
  "first",
  "second",
  "finally",
  "similarly",
  "in conclusion",
  "notably"
];

const POWER_WORDS = [
  "complete",
  "ultimate",
  "essential",
  "guide",
  "proven",
  "modern",
  "fast",
  "reliable",
  "secure",
  "step-by-step",
  "practical",
  "effective",
  "definitive",
  "instant",
  "master",
  "new",
  "best",
  "how to",
  "why"
];

export function extractDocumentStructure(document: ContentDocument): {
  fullText: string;
  firstParagraphText: string;
  headings: Array<{ level: number; text: string }>;
  paragraphs: string[];
  images: Array<{ url: string; alt: string }>;
  links: string[];
  faqItems: FaqBlockItem[];
} {
  const headings: Array<{ level: number; text: string }> = [];
  const paragraphs: string[] = [];
  const images: Array<{ url: string; alt: string }> = [];
  const links: string[] = [];
  const faqItems: FaqBlockItem[] = [];
  const textParts: string[] = [];

  for (const block of document.blocks) {
    switch (block.type) {
      case "heading": {
        const p = block.props as unknown as HeadingBlockProps;
        if (p.text) {
          headings.push({ level: Number(p.level || 2), text: p.text });
          textParts.push(p.text);
        }
        break;
      }
      case "paragraph": {
        const p = block.props as unknown as ParagraphBlockProps;
        if (p.text) {
          paragraphs.push(p.text);
          textParts.push(p.text);
        }
        break;
      }
      case "image": {
        const p = block.props as unknown as ImageBlockProps;
        images.push({ url: p.url || "", alt: (p.alt || "").trim() });
        if (p.caption) textParts.push(p.caption);
        break;
      }
      case "button": {
        const p = block.props as unknown as ButtonBlockProps;
        if (p.href) links.push(p.href.trim());
        if (p.label) textParts.push(p.label);
        break;
      }
      case "callout": {
        const p = block.props as unknown as CalloutBlockProps;
        if (p.title) textParts.push(p.title);
        if (p.text) {
          paragraphs.push(p.text);
          textParts.push(p.text);
        }
        break;
      }
      case "columns": {
        const p = block.props as unknown as ColumnsBlockProps;
        if (Array.isArray(p.items)) {
          for (const col of p.items) {
            if (col.title) headings.push({ level: 3, text: col.title });
            if (col.body) {
              paragraphs.push(col.body);
              textParts.push(`${col.title}. ${col.body}`);
            }
          }
        }
        break;
      }
      case "faq": {
        const p = block.props as unknown as FaqBlockProps;
        if (p.title) headings.push({ level: 2, text: p.title });
        if (Array.isArray(p.items)) {
          for (const item of p.items) {
            faqItems.push(item);
            paragraphs.push(item.answer);
            textParts.push(`${item.question} ${item.answer}`);
          }
        }
        break;
      }
    }
  }

  return {
    fullText: textParts.join(" ").trim(),
    firstParagraphText: paragraphs[0] ?? "",
    headings,
    paragraphs,
    images,
    links,
    faqItems
  };
}

function splitWords(text: string): string[] {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9'-]/g, ""))
    .filter(Boolean);
}

function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

function countSubstrings(haystack: string, needle: string): number {
  const cleanNeedle = needle.trim().toLowerCase();
  if (!cleanNeedle) return 0;
  const cleanHaystack = haystack.toLowerCase();
  let count = 0;
  let pos = 0;
  while ((pos = cleanHaystack.indexOf(cleanNeedle, pos)) !== -1) {
    count++;
    pos += cleanNeedle.length;
  }
  return count;
}

/**
 * Runs the full Rank Math / Yoast / AIOSEO TruSEO & Readability evaluation.
 */
export function analyzeSeoAndReadability(input: {
  title: string;
  slug: string;
  excerpt: string;
  kind: ContentKind;
  document: ContentDocument;
  seo: SeoMetadata;
  siteName: string;
  siteTagline?: string;
  siteSeoDefaults?: SeoMetadata;
  authorName?: string;
}): ContentSeoAnalysis {
  const struct = extractDocumentStructure(input.document);
  const words = splitWords(struct.fullText);
  const wordCount = words.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const sentences = splitSentences(struct.fullText);
  const sentenceCount = sentences.length;

  const separator =
    input.seo.titleSeparator || input.siteSeoDefaults?.titleSeparator || "|";
  const defaultTemplate =
    input.kind === "post"
      ? input.siteSeoDefaults?.titleTemplatePost || "%%title%% %%sep%% %%sitename%%"
      : input.siteSeoDefaults?.titleTemplatePage || "%%title%% %%sep%% %%sitename%%";

  const focusKeyword = (input.seo.focusKeyword ?? "").trim();
  const isCornerstone = Boolean(input.seo.isCornerstone);

  const tagCtx: SmartTagContext = {
    title: input.title,
    siteName: input.siteName,
    tagline: input.siteTagline,
    separator,
    excerpt: input.excerpt || struct.firstParagraphText.slice(0, 155),
    authorName: input.authorName,
    focusKeyword
  };

  const resolvedTitle = resolveSmartTags(
    input.seo.metaTitle?.trim() || defaultTemplate,
    tagCtx
  );
  const resolvedDescription = resolveSmartTags(
    input.seo.metaDescription?.trim() || input.excerpt || struct.firstParagraphText.slice(0, 155),
    tagCtx
  );

  // Links classification
  const internalLinks = struct.links.filter(
    (href) => href.startsWith("/") || href.includes("localhost") || href.includes("nextpress")
  );
  const externalLinks = struct.links.filter(
    (href) =>
      (href.startsWith("http://") || href.startsWith("https://")) &&
      !internalLinks.includes(href)
  );

  // Keyword frequency & density
  const keywordCount = focusKeyword ? countSubstrings(struct.fullText, focusKeyword) : 0;
  const kwWordLen = focusKeyword ? Math.max(1, splitWords(focusKeyword).length) : 1;
  const keywordDensityPercent =
    wordCount > 0 && focusKeyword
      ? Number((((keywordCount * kwWordLen) / wordCount) * 100).toFixed(2))
      : 0;

  // Readability ratios (Yoast)
  const longSentences = sentences.filter((s) => splitWords(s).length > 20);
  const longSentenceRatio =
    sentenceCount > 0 ? Math.round((longSentences.length / sentenceCount) * 100) : 0;

  const transitionSentences = sentences.filter((s) => {
    const lower = s.toLowerCase();
    return TRANSITION_WORDS.some((tw) => lower.includes(tw));
  });
  const transitionSentenceRatio =
    sentenceCount > 0 ? Math.round((transitionSentences.length / sentenceCount) * 100) : 0;

  const passiveRegex = /\b(am|are|is|was|were|been|being)\s+\w+ed\b/i;
  const passiveSentences = sentences.filter((s) => passiveRegex.test(s));
  const passiveSentenceRatio =
    sentenceCount > 0 ? Math.round((passiveSentences.length / sentenceCount) * 100) : 0;

  const checks: SeoCheckResult[] = [];

  // 1. Focus Keyword Present (Basic - 10 pts)
  const hasFocusKw = focusKeyword.length >= 2;
  checks.push({
    id: "focus-kw-set",
    category: "basic",
    label: "Focus keyword configured",
    status: hasFocusKw ? "pass" : "fail",
    detail: hasFocusKw
      ? `Target focus keyword is "${focusKeyword}".`
      : "Add a primary focus keyword to unlock targeted on-page checks.",
    points: hasFocusKw ? 10 : 0,
    maxPoints: 10
  });

  // 2. Focus Keyword in SEO Title (Basic - 12 pts)
  const kwInTitle =
    hasFocusKw && resolvedTitle.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: "focus-kw-title",
    category: "basic",
    label: "Focus keyword in SEO title",
    status: kwInTitle ? "pass" : hasFocusKw ? "fail" : "warn",
    detail: kwInTitle
      ? "Focus keyword appears in the resolved SEO title."
      : "Include your focus keyword near the beginning of the SEO title.",
    points: kwInTitle ? 12 : 0,
    maxPoints: 12
  });

  // 3. Focus Keyword in Meta Description (Basic - 8 pts)
  const kwInDesc =
    hasFocusKw && resolvedDescription.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: "focus-kw-desc",
    category: "basic",
    label: "Focus keyword in meta description",
    status: kwInDesc ? "pass" : hasFocusKw ? "warn" : "warn",
    detail: kwInDesc
      ? "Meta description includes the focus keyword."
      : "Mention your focus keyword in the meta description to boost click-through rates.",
    points: kwInDesc ? 8 : 0,
    maxPoints: 8
  });

  // 4. Focus Keyword in URL Slug (Basic - 8 pts)
  const kwSlugToken = focusKeyword.toLowerCase().replace(/\s+/g, "-");
  const kwInSlug =
    hasFocusKw &&
    (input.slug.toLowerCase().includes(kwSlugToken) ||
      kwSlugToken.includes(input.slug.toLowerCase()));
  checks.push({
    id: "focus-kw-slug",
    category: "basic",
    label: "Focus keyword in URL slug",
    status: kwInSlug ? "pass" : "warn",
    detail: kwInSlug
      ? `Slug "/${input.slug}" matches the focus keyword.`
      : "Use a concise URL slug that includes your primary keyword.",
    points: kwInSlug ? 8 : 2,
    maxPoints: 8
  });

  // 5. Focus Keyword in Lead / First Paragraph (Basic - 8 pts)
  const kwInLead =
    hasFocusKw &&
    struct.firstParagraphText.toLowerCase().includes(focusKeyword.toLowerCase());
  checks.push({
    id: "focus-kw-lead",
    category: "basic",
    label: "Focus keyword in opening paragraph",
    status: kwInLead ? "pass" : "warn",
    detail: kwInLead
      ? "Focus keyword appears in the opening paragraph."
      : "Introduce your focus keyword in the first paragraph.",
    points: kwInLead ? 8 : 2,
    maxPoints: 8
  });

  // 6. Content Length / Cornerstone Threshold (Basic - 10 pts)
  const minWords = isCornerstone ? 120 : 50;
  const goodWords = isCornerstone ? 250 : 120;
  const wordStatus: SeoCheckStatus =
    wordCount >= goodWords ? "pass" : wordCount >= minWords ? "warn" : "fail";
  checks.push({
    id: "content-length",
    category: "basic",
    label: isCornerstone ? "Cornerstone content depth" : "Content word count",
    status: wordStatus,
    detail: `${wordCount} words (${readingTimeMinutes} min read). ${
      isCornerstone
        ? `Cornerstone target: ${goodWords}+ words.`
        : `Recommended target: ${goodWords}+ words.`
    }`,
    points: wordStatus === "pass" ? 10 : wordStatus === "warn" ? 6 : 2,
    maxPoints: 10
  });

  // 7. Focus Keyword in Subheadings H2-H4 (Additional - 6 pts)
  const subheadings = struct.headings.filter((h) => h.level >= 2);
  const kwInSubheading =
    hasFocusKw &&
    subheadings.some((h) => h.text.toLowerCase().includes(focusKeyword.toLowerCase()));
  checks.push({
    id: "focus-kw-subheading",
    category: "additional",
    label: "Focus keyword in H2/H3 subheadings",
    status: kwInSubheading ? "pass" : subheadings.length > 0 ? "warn" : "fail",
    detail: kwInSubheading
      ? "Focus keyword is reinforced in a section subheading."
      : "Include your focus keyword or a close synonym in at least one H2 or H3 block.",
    points: kwInSubheading ? 6 : subheadings.length > 0 ? 3 : 0,
    maxPoints: 6
  });

  // 8. Keyword Density (Additional - 6 pts)
  const densityPass = keywordDensityPercent >= 0.4 && keywordDensityPercent <= 3.0;
  checks.push({
    id: "keyword-density",
    category: "additional",
    label: "Keyword density balance",
    status: densityPass ? "pass" : keywordCount > 0 ? "warn" : "fail",
    detail: hasFocusKw
      ? `Keyword density is ${keywordDensityPercent}% (${keywordCount} occurrences). Optimal range is 0.5%–2.5%.`
      : "Set a focus keyword to measure keyword density.",
    points: densityPass ? 6 : keywordCount > 0 ? 3 : 0,
    maxPoints: 6
  });

  // 9. Image & Alt Text Optimization (Additional - 6 pts)
  const imagesWithAlt = struct.images.filter((img) => img.alt.length > 0).length;
  const imgStatus: SeoCheckStatus =
    struct.images.length > 0 && imagesWithAlt === struct.images.length
      ? "pass"
      : struct.images.length > 0
        ? "warn"
        : "warn";
  checks.push({
    id: "image-alt",
    category: "additional",
    label: "Multimedia & image alt attributes",
    status: imgStatus,
    detail:
      struct.images.length > 0
        ? `${imagesWithAlt}/${struct.images.length} image(s) have descriptive alt text.`
        : "Add at least one Image block with descriptive alt text to enrich visual engagement.",
    points: imgStatus === "pass" ? 6 : 3,
    maxPoints: 6
  });

  // 10. Internal Linking Structure (Additional - 6 pts)
  const hasInternalLinks = internalLinks.length >= 1;
  checks.push({
    id: "internal-links",
    category: "additional",
    label: "Internal link structure",
    status: hasInternalLinks ? "pass" : "warn",
    detail: hasInternalLinks
      ? `Contains ${internalLinks.length} internal link(s) to other site routes.`
      : "Add at least one internal Button/Link block pointing to related content on your site.",
    points: hasInternalLinks ? 6 : 2,
    maxPoints: 6
  });

  // 11. SEO Title Length & Power Words (Title - 8 pts)
  const titleLen = resolvedTitle.length;
  const titleLenOk = titleLen >= 25 && titleLen <= 65;
  const hasPowerWord = POWER_WORDS.some((pw) => resolvedTitle.toLowerCase().includes(pw));
  checks.push({
    id: "title-optimization",
    category: "title",
    label: "SEO title length & power words",
    status: titleLenOk && hasPowerWord ? "pass" : titleLenOk ? "pass" : "warn",
    detail: `Resolved title is ${titleLen} chars (ideal: 30–60 chars)${
      hasPowerWord ? " and contains a high-intent power word." : "."
    }`,
    points: titleLenOk ? 8 : 4,
    maxPoints: 8
  });

  // 12. Meta Description Length (Title - 4 pts)
  const descLen = resolvedDescription.length;
  const descLenOk = descLen >= 70 && descLen <= 165;
  checks.push({
    id: "meta-desc-length",
    category: "title",
    label: "Meta description length",
    status: descLenOk ? "pass" : descLen > 0 ? "warn" : "fail",
    detail: `Resolved description is ${descLen} chars (ideal: 110–160 chars).`,
    points: descLenOk ? 4 : descLen > 0 ? 2 : 0,
    maxPoints: 4
  });

  // 13. Readability: Sentence Length (Readability - 4 pts)
  const sentenceLenOk = longSentenceRatio <= 25;
  checks.push({
    id: "readability-sentences",
    category: "readability",
    label: "Sentence length (<20 words)",
    status: sentenceLenOk ? "pass" : "warn",
    detail: `${longSentenceRatio}% of sentences exceed 20 words (recommended maximum: 25%).`,
    points: sentenceLenOk ? 4 : 2,
    maxPoints: 4
  });

  // 14. Readability: Paragraph Density (Readability - 4 pts)
  const denseParagraphs = struct.paragraphs.filter((p) => splitWords(p).length > 150);
  const paraOk = denseParagraphs.length === 0;
  checks.push({
    id: "readability-paragraphs",
    category: "readability",
    label: "Paragraph scannability",
    status: paraOk ? "pass" : "warn",
    detail: paraOk
      ? "All paragraphs are concise and easy to scan."
      : `${denseParagraphs.length} paragraph(s) exceed 150 words; split them into shorter blocks.`,
    points: paraOk ? 4 : 2,
    maxPoints: 4
  });

  // 15. Readability: Passive Voice & Transition Flow (Readability - 4 pts)
  const activeVoiceOk = passiveSentenceRatio <= 15;
  checks.push({
    id: "readability-voice",
    category: "readability",
    label: "Active voice & transition flow",
    status: activeVoiceOk ? "pass" : "warn",
    detail: `${passiveSentenceRatio}% passive sentences (target <=15%) · ${transitionSentenceRatio}% transition words.`,
    points: activeVoiceOk ? 4 : 2,
    maxPoints: 4
  });

  const earnedPoints = checks.reduce((sum, c) => sum + c.points, 0);
  const totalMax = checks.reduce((sum, c) => sum + c.maxPoints, 0);
  const overallScore = totalMax > 0 ? Math.round((earnedPoints / totalMax) * 100) : 0;

  const status: TrafficLight =
    overallScore >= 80 ? "good" : overallScore >= 55 ? "ok" : "needs-work";

  const readabilityChecks = checks.filter((c) => c.category === "readability");
  const readEarned = readabilityChecks.reduce((s, c) => s + c.points, 0);
  const readMax = readabilityChecks.reduce((s, c) => s + c.maxPoints, 0);
  const readRatio = readMax > 0 ? readEarned / readMax : 1;
  const readabilityStatus: TrafficLight =
    readRatio >= 0.8 ? "good" : readRatio >= 0.5 ? "ok" : "needs-work";

  return {
    overallScore,
    status,
    readabilityStatus,
    resolvedTitle,
    resolvedDescription,
    stats: {
      wordCount,
      readingTimeMinutes,
      sentenceCount,
      paragraphCount: struct.paragraphs.length,
      headingCount: struct.headings.length,
      imageCount: struct.images.length,
      imagesWithAlt,
      internalLinkCount: internalLinks.length,
      externalLinkCount: externalLinks.length,
      keywordCount,
      keywordDensityPercent,
      transitionSentenceRatio,
      passiveSentenceRatio,
      longSentenceRatio
    },
    checks
  };
}

export type InternalLinkSuggestion = {
  id: string;
  title: string;
  kind: ContentKind;
  publicPath: string;
  isCornerstone: boolean;
  alreadyLinked: boolean;
  relevanceReason: string;
};

/**
 * Generates Yoast-style internal linking suggestions, prioritizing Cornerstone content
 * and keyword/topic matches.
 */
export function suggestInternalLinks(input: {
  currentItemId: string;
  siteSlug: string;
  document: ContentDocument;
  candidates: ContentSummary[];
}): InternalLinkSuggestion[] {
  const struct = extractDocumentStructure(input.document);
  const lowerBody = struct.fullText.toLowerCase();

  return input.candidates
    .filter((c) => c.id !== input.currentItemId)
    .map((c) => {
      const publicPath =
        c.kind === "page"
          ? c.slug === "home"
            ? `/s/${input.siteSlug}`
            : `/s/${input.siteSlug}/${c.slug}`
          : `/s/${input.siteSlug}/blog/${c.slug}`;

      const alreadyLinked = struct.links.some(
        (href) => href === publicPath || href.endsWith(`/${c.slug}`)
      );

      const titleTokens = splitWords(c.title.toLowerCase()).filter((w) => w.length > 3);
      const matchingTokens = titleTokens.filter((t) => lowerBody.includes(t));

      let score = 0;
      if (c.isCornerstone) score += 30;
      score += matchingTokens.length * 10;
      if (c.status === "published") score += 5;

      const relevanceReason = c.isCornerstone
        ? "★ Cornerstone pillar content"
        : matchingTokens.length > 0
          ? `Matches topic keywords (${matchingTokens.slice(0, 2).join(", ")})`
          : `Related ${c.kind}`;

      return {
        suggestion: {
          id: c.id,
          title: c.title,
          kind: c.kind,
          publicPath,
          isCornerstone: Boolean(c.isCornerstone),
          alreadyLinked,
          relevanceReason
        },
        score
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((entry) => entry.suggestion);
}

/**
 * Generates a unified Schema.org JSON-LD @graph (Yoast Schema Graph + Rank Math Schema + AIOSEO Local SEO).
 */
export function buildSchemaGraph(input: {
  baseUrl: string;
  site: SiteRecord;
  item: {
    id: string;
    kind: ContentKind;
    title: string;
    slug: string;
    excerpt: string;
    authorName: string;
    publishedAt: string | null;
    updatedAt: string;
    document: ContentDocument;
    seo: SeoMetadata;
  };
}): Record<string, unknown> {
  const baseUrl = input.baseUrl.replace(/\/$/, "");
  const siteUrl = `${baseUrl}/s/${input.site.slug}`;
  const pageUrl =
    input.item.kind === "page"
      ? input.item.slug === "home"
        ? siteUrl
        : `${siteUrl}/${input.item.slug}`
      : `${siteUrl}/blog/${input.item.slug}`;

  const struct = extractDocumentStructure(input.item.document);
  const siteSeo = input.site.seoDefaults;

  const separator = input.item.seo.titleSeparator || siteSeo.titleSeparator || "|";
  const resolvedTitle = resolveSmartTags(
    input.item.seo.metaTitle || "%%title%% %%sep%% %%sitename%%",
    {
      title: input.item.title,
      siteName: input.site.name,
      tagline: input.site.tagline,
      separator,
      excerpt: input.item.excerpt,
      authorName: input.item.authorName,
      focusKeyword: input.item.seo.focusKeyword
    }
  );
  const resolvedDescription =
    resolveSmartTags(input.item.seo.metaDescription, {
      title: input.item.title,
      siteName: input.site.name,
      tagline: input.site.tagline,
      separator,
      excerpt: input.item.excerpt,
      authorName: input.item.authorName
    }) ||
    input.item.excerpt ||
    input.site.description;

  const orgId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;
  const webpageId = `${pageUrl}#webpage`;
  const breadcrumbId = `${pageUrl}#breadcrumb`;

  const kgType = siteSeo.knowledgeGraphType || "Organization";
  const orgNode: Record<string, unknown> = {
    "@type":
      kgType === "LocalBusiness"
        ? siteSeo.localBusinessCategory || "LocalBusiness"
        : kgType,
    "@id": orgId,
    name: siteSeo.organizationName || input.site.name,
    url: siteUrl,
    logo: siteSeo.organizationLogo || `${baseUrl}/nextpress-mark.svg`,
    ...(Array.isArray(siteSeo.socialProfiles) && siteSeo.socialProfiles.length > 0
      ? { sameAs: siteSeo.socialProfiles }
      : {})
  };

  if (kgType === "LocalBusiness" || input.item.seo.schemaType === "LocalBusiness") {
    if (siteSeo.phone) orgNode.telephone = siteSeo.phone;
    if (siteSeo.openingHours) orgNode.openingHours = siteSeo.openingHours;
    if (siteSeo.streetAddress || siteSeo.addressLocality) {
      orgNode.address = {
        "@type": "PostalAddress",
        streetAddress: siteSeo.streetAddress || "",
        addressLocality: siteSeo.addressLocality || "",
        postalCode: siteSeo.postalCode || "",
        addressCountry: siteSeo.addressCountry || "US"
      };
    }
  }

  const websiteNode: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteUrl,
    name: input.site.name,
    description: input.site.description,
    publisher: { "@id": orgId }
  };

  const breadcrumbItems: Array<Record<string, unknown>> = [
    {
      "@type": "ListItem",
      position: 1,
      name: input.site.name,
      item: siteUrl
    }
  ];

  if (input.item.kind === "post") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: input.item.seo.breadcrumbTitle || input.item.title,
      item: pageUrl
    });
  } else if (input.item.slug !== "home") {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 2,
      name: input.item.seo.breadcrumbTitle || input.item.title,
      item: pageUrl
    });
  }

  const breadcrumbNode: Record<string, unknown> = {
    "@type": "BreadcrumbList",
    "@id": breadcrumbId,
    itemListElement: breadcrumbItems
  };

  const webpageNode: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": webpageId,
    url: input.item.seo.canonicalUrl || pageUrl,
    name: resolvedTitle,
    description: resolvedDescription,
    isPartOf: { "@id": websiteId },
    breadcrumb: { "@id": breadcrumbId },
    datePublished: input.item.publishedAt || input.item.updatedAt,
    dateModified: input.item.updatedAt
  };

  const graph: Array<Record<string, unknown>> = [
    orgNode,
    websiteNode,
    breadcrumbNode,
    webpageNode
  ];

  const schemaType =
    input.item.seo.schemaType ||
    (input.item.kind === "post" ? "BlogPosting" : "WebPage");

  if (
    schemaType === "Article" ||
    schemaType === "BlogPosting" ||
    schemaType === "NewsArticle"
  ) {
    graph.push({
      "@type": schemaType,
      "@id": `${pageUrl}#article`,
      isPartOf: { "@id": webpageId },
      headline: input.item.title,
      description: resolvedDescription,
      author: {
        "@type": "Person",
        name: input.item.authorName
      },
      publisher: { "@id": orgId },
      datePublished: input.item.publishedAt || input.item.updatedAt,
      dateModified: input.item.updatedAt,
      mainEntityOfPage: { "@id": webpageId },
      ...(input.item.seo.focusKeyword ? { keywords: input.item.seo.focusKeyword } : {})
    });
  } else if (schemaType !== "WebPage" && schemaType !== "FAQPage") {
    graph.push({
      "@type": schemaType,
      "@id": `${pageUrl}#entity`,
      name: input.item.title,
      description: resolvedDescription,
      provider: { "@id": orgId }
    });
  }

  // Automatic FAQPage Schema if document contains an FAQ block or schemaType === 'FAQPage'
  if (struct.faqItems.length > 0 || schemaType === "FAQPage") {
    graph.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      isPartOf: { "@id": webpageId },
      mainEntity: struct.faqItems.map((q) => ({
        "@type": "Question",
        name: q.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: q.answer
        }
      }))
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph
  };
}
