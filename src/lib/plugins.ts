export type PluginHookName =
  | "site:headerBanner"
  | "content:readingTime"
  | "block:codeEnhance"
  | "site:footerBadge"
  | "seo:extendSchema"
  | "block:register";

export type PluginCategorySlug =
  | "seo"
  | "editorial"
  | "ui"
  | "performance"
  | "forms"
  | "commerce"
  | "analytics"
  | "security";

export type PluginCategoryFilter = "all" | PluginCategorySlug;

export type PluginSearchField = "all" | "name" | "category" | "tag" | "author";

export type PluginBrowseTab = "all" | "featured" | "popular" | "recommended";

export const PLUGIN_CATEGORIES: ReadonlyArray<{
  slug: PluginCategorySlug;
  label: string;
  shortLabel: string;
  keywords: string[];
  description: string;
}> = [
  {
    slug: "seo",
    label: "SEO & Schema",
    shortLabel: "SEO",
    keywords: ["seo", "schema", "json-ld", "sitemap", "redirect", "meta", "search"],
    description: "Structured data, link auditing, local SEO, and search visibility."
  },
  {
    slug: "editorial",
    label: "Editorial & Content",
    shortLabel: "Editorial",
    keywords: ["editorial", "content", "reading", "toc", "table of contents", "writing", "blog"],
    description: "Reading time, tables of contents, related posts, and author workflows."
  },
  {
    slug: "ui",
    label: "UI & Blocks",
    shortLabel: "UI & Blocks",
    keywords: ["ui", "blocks", "banner", "announcement", "syntax", "code", "design", "widget"],
    description: "Interactive blocks, announcement bars, syntax highlighting, and layout chrome."
  },
  {
    slug: "performance",
    label: "Performance & Edge",
    shortLabel: "Performance",
    keywords: ["performance", "cwv", "web vitals", "cache", "image", "lcp", "speed", "edge"],
    description: "Core Web Vitals telemetry, LCP image optimization, and edge caching."
  },
  {
    slug: "forms",
    label: "Forms & Lead Gen",
    shortLabel: "Forms",
    keywords: ["forms", "newsletter", "contact", "email", "lead", "subscribe", "webhook"],
    description: "Newsletter capture, contact forms, and webhook integrations."
  },
  {
    slug: "commerce",
    label: "Commerce & Payments",
    shortLabel: "Commerce",
    keywords: ["commerce", "stripe", "checkout", "payments", "shop", "pricing", "subscriptions"],
    description: "Stripe checkout buttons, digital downloads, and subscription gates."
  },
  {
    slug: "analytics",
    label: "Analytics & Telemetry",
    shortLabel: "Analytics",
    keywords: ["analytics", "telemetry", "plausible", "posthog", "metrics", "events", "privacy"],
    description: "Privacy-first visitor analytics, conversion funnels, and event tracking."
  },
  {
    slug: "security",
    label: "Security & Compliance",
    shortLabel: "Security",
    keywords: ["security", "auth", "turnstile", "captcha", "2fa", "passkey", "headers", "firewall"],
    description: "Bot mitigation, two-factor authentication, CSP headers, and audit protection."
  }
] as const;

export type NodePluginManifest = {
  packageName: string;
  displayName: string;
  version: string;
  category: PluginCategorySlug;
  categoryLabel: string;
  tags: string[];
  description: string;
  author: string;
  homepage?: string;
  hooks: PluginHookName[];
  defaultConfig: Record<string, string | boolean | number>;
  rating: number;
  ratingCount: number;
  activeInstalls: number;
  lastUpdated: string;
  testedUpTo: string;
  featured?: boolean;
  popular?: boolean;
  recommended?: boolean;
  isBuiltInPackage?: boolean;
};

export type SitePluginRecord = {
  id: string;
  siteId: string;
  packageName: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  hooks: PluginHookName[];
  enabled: boolean;
  config: Record<string, string | boolean | number>;
  installedAt: string;
  updatedAt: string;
};

/**
 * Complete WordPress-style Node Package Plugin Directory searchable by Name, Category, Tag, or Author.
 */
export const NODE_PLUGIN_DIRECTORY: NodePluginManifest[] = [
  {
    packageName: "@nextpress/plugin-announcement-bar",
    displayName: "NextPress Announcement Bar",
    version: "1.2.0",
    category: "ui",
    categoryLabel: "UI & Blocks",
    tags: ["banner", "announcement", "header", "cta", "marketing"],
    description:
      "Renders a customizable top announcement banner across public site routes with CTA link support.",
    author: "NextPress Core Team",
    homepage: "https://npmjs.com/package/@nextpress/plugin-announcement-bar",
    hooks: ["site:headerBanner"],
    defaultConfig: {
      bannerText:
        "NextPress.js 2026 Release — Built-in Rank Math, Yoast & AIOSEO Intelligence is live!",
      ctaLabel: "Explore Features",
      ctaHref: "/s/flagship/about"
    },
    rating: 4.9,
    ratingCount: 184,
    activeInstalls: 42000,
    lastUpdated: "2 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true,
    recommended: true,
    isBuiltInPackage: true
  },
  {
    packageName: "@nextpress/plugin-reading-time",
    displayName: "NextPress Reading Time & Word Counter",
    version: "1.1.4",
    category: "editorial",
    categoryLabel: "Editorial & Content",
    tags: ["reading-time", "word-count", "editorial", "blog", "articles"],
    description:
      "Calculates words-per-minute reading time from canonical ContentDocument blocks and displays a badge on public pages and posts.",
    author: "NextPress Core Team",
    homepage: "https://npmjs.com/package/@nextpress/plugin-reading-time",
    hooks: ["content:readingTime"],
    defaultConfig: {
      wordsPerMinute: 200,
      showWordCount: true
    },
    rating: 5.0,
    ratingCount: 230,
    activeInstalls: 58000,
    lastUpdated: "5 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true,
    recommended: true,
    isBuiltInPackage: true
  },
  {
    packageName: "@nextpress/plugin-prism-syntax",
    displayName: "NextPress Code Block Enhancer",
    version: "2.0.1",
    category: "ui",
    categoryLabel: "UI & Blocks",
    tags: ["code", "syntax-highlighting", "prism", "shiki", "developer"],
    description:
      "Enhances structured code blocks with language headers, line count indicators, and terminal chrome.",
    author: "NextPress Labs",
    homepage: "https://npmjs.com/package/@nextpress/plugin-prism-syntax",
    hooks: ["block:codeEnhance"],
    defaultConfig: {
      showLineCount: true,
      terminalHeader: true
    },
    rating: 4.8,
    ratingCount: 119,
    activeInstalls: 31000,
    lastUpdated: "1 week ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    recommended: true,
    isBuiltInPackage: true
  },
  {
    packageName: "@nextpress/plugin-web-vitals",
    displayName: "NextPress Core Web Vitals Badge",
    version: "1.0.8",
    category: "performance",
    categoryLabel: "Performance & Edge",
    tags: ["cwv", "lcp", "inp", "cls", "performance", "telemetry"],
    description:
      "Adds a lightweight Core Web Vitals & carbon-aware edge rendering badge to the public site footer.",
    author: "NextPress Performance",
    homepage: "https://npmjs.com/package/@nextpress/plugin-web-vitals",
    hooks: ["site:footerBadge"],
    defaultConfig: {
      badgeLabel: "CWV Passing · Zero Client JS Overhead"
    },
    rating: 4.9,
    ratingCount: 164,
    activeInstalls: 49000,
    lastUpdated: "3 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true,
    recommended: true,
    isBuiltInPackage: true
  },
  {
    packageName: "@nextpress/plugin-table-of-contents",
    displayName: "NextPress Sticky Table of Contents",
    version: "1.4.2",
    category: "editorial",
    categoryLabel: "Editorial & Content",
    tags: ["toc", "headings", "navigation", "anchor-links", "seo"],
    description:
      "Automatically builds an accessible, collapsible Table of Contents from H2 and H3 heading blocks with deep-link anchors.",
    author: "NextPress Core Team",
    homepage: "https://npmjs.com/package/@nextpress/plugin-table-of-contents",
    hooks: ["content:readingTime", "seo:extendSchema"],
    defaultConfig: {
      minHeadings: 2,
      includeH3: true,
      smoothScroll: true
    },
    rating: 4.9,
    ratingCount: 142,
    activeInstalls: 36500,
    lastUpdated: "4 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true,
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-local-business-schema",
    displayName: "NextPress Local SEO & Geo Schema Pro",
    version: "1.3.0",
    category: "seo",
    categoryLabel: "SEO & Schema",
    tags: ["local-seo", "schema", "json-ld", "maps", "opening-hours"],
    description:
      "Extends the Schema.org @graph with multi-location LocalBusiness, GeoCoordinates, OpeningHoursSpecification, and aggregate ratings.",
    author: "NextPress SEO Guild",
    homepage: "https://npmjs.com/package/@nextpress/plugin-local-business-schema",
    hooks: ["seo:extendSchema"],
    defaultConfig: {
      businessType: "ProfessionalService",
      priceRange: "$$",
      enableGeoCoordinates: true
    },
    rating: 4.8,
    ratingCount: 98,
    activeInstalls: 24000,
    lastUpdated: "1 week ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-broken-link-checker",
    displayName: "NextPress Link Health & Redirect Guard",
    version: "1.1.9",
    category: "seo",
    categoryLabel: "SEO & Schema",
    tags: ["links", "404", "redirects", "seo-audit", "crawler"],
    description:
      "Scans outbound and internal links inside ContentDocument blocks for dead URLs and suggests 301 redirect rules.",
    author: "NextPress SEO Guild",
    homepage: "https://npmjs.com/package/@nextpress/plugin-broken-link-checker",
    hooks: ["seo:extendSchema"],
    defaultConfig: {
      checkExternalLinks: true,
      autoFlagNoFollow: false
    },
    rating: 4.7,
    ratingCount: 87,
    activeInstalls: 19500,
    lastUpdated: "2 weeks ago",
    testedUpTo: "NextPress 16.4",
    popular: true
  },
  {
    packageName: "@nextpress/plugin-newsletter-forms",
    displayName: "NextPress Newsletter & Lead Capture",
    version: "2.1.0",
    category: "forms",
    categoryLabel: "Forms & Lead Gen",
    tags: ["newsletter", "email", "forms", "convertkit", "resend", "mailchimp"],
    description:
      "Provides inline subscribe forms with double opt-in webhook delivery for Resend, ConvertKit, Mailchimp, and Buttondown.",
    author: "NextPress Growth Lab",
    homepage: "https://npmjs.com/package/@nextpress/plugin-newsletter-forms",
    hooks: ["block:register", "site:footerBadge"],
    defaultConfig: {
      provider: "resend",
      doubleOptIn: true,
      buttonLabel: "Subscribe Weekly"
    },
    rating: 4.9,
    ratingCount: 205,
    activeInstalls: 44000,
    lastUpdated: "3 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true,
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-contact-form-next",
    displayName: "Contact Form Next (Accessible Forms)",
    version: "1.5.3",
    category: "forms",
    categoryLabel: "Forms & Lead Gen",
    tags: ["contact-form", "forms", "honeypot", "validation", "email"],
    description:
      "Zero-client-bloat contact and inquiry forms built on React 19 Server Actions with native ValidityState validation and honeypot spam protection.",
    author: "NextPress Community",
    homepage: "https://npmjs.com/package/@nextpress/plugin-contact-form-next",
    hooks: ["block:register"],
    defaultConfig: {
      enableHoneypot: true,
      notifySiteOwner: true,
      successMessage: "Thank you! Your message has been received."
    },
    rating: 4.8,
    ratingCount: 176,
    activeInstalls: 39000,
    lastUpdated: "6 days ago",
    testedUpTo: "NextPress 16.4",
    popular: true,
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-stripe-checkout",
    displayName: "NextPress Stripe Checkout & Pricing Blocks",
    version: "1.6.0",
    category: "commerce",
    categoryLabel: "Commerce & Payments",
    tags: ["stripe", "payments", "ecommerce", "checkout", "subscriptions"],
    description:
      "Embed Stripe Payment Links, recurring membership tiers, and instant checkout buttons directly inside NextPress pages.",
    author: "NextPress Commerce",
    homepage: "https://npmjs.com/package/@nextpress/plugin-stripe-checkout",
    hooks: ["block:register", "seo:extendSchema"],
    defaultConfig: {
      currency: "USD",
      collectBillingAddress: true,
      testMode: true
    },
    rating: 4.9,
    ratingCount: 134,
    activeInstalls: 28500,
    lastUpdated: "5 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true
  },
  {
    packageName: "@nextpress/plugin-lemon-squeezy",
    displayName: "Lemon Squeezy Digital Downloads",
    version: "1.2.4",
    category: "commerce",
    categoryLabel: "Commerce & Payments",
    tags: ["lemon-squeezy", "digital-downloads", "commerce", "merchant-of-record"],
    description:
      "Sell digital templates, software licenses, and gated posts with global tax compliance and overlay checkout.",
    author: "NextPress Commerce",
    homepage: "https://npmjs.com/package/@nextpress/plugin-lemon-squeezy",
    hooks: ["block:register"],
    defaultConfig: {
      overlayCheckout: true,
      emitProductSchema: true
    },
    rating: 4.8,
    ratingCount: 73,
    activeInstalls: 15200,
    lastUpdated: "2 weeks ago",
    testedUpTo: "NextPress 16.4",
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-plausible-analytics",
    displayName: "Plausible Privacy-First Analytics",
    version: "1.3.1",
    category: "analytics",
    categoryLabel: "Analytics & Telemetry",
    tags: ["plausible", "analytics", "gdpr", "privacy", "outbound-links"],
    description:
      "Lightweight (< 1 KB) cookie-free analytics script with automatic 404 tracking and custom outbound link click events.",
    author: "NextPress Analytics",
    homepage: "https://npmjs.com/package/@nextpress/plugin-plausible-analytics",
    hooks: ["site:footerBadge"],
    defaultConfig: {
      trackOutboundLinks: true,
      track404Pages: true,
      hashMode: false
    },
    rating: 5.0,
    ratingCount: 192,
    activeInstalls: 46000,
    lastUpdated: "4 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true,
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-posthog-insights",
    displayName: "PostHog Product Analytics & Funnels",
    version: "1.1.2",
    category: "analytics",
    categoryLabel: "Analytics & Telemetry",
    tags: ["posthog", "analytics", "funnels", "feature-flags", "events"],
    description:
      "Captures pageview funnels, CTA button conversions, and server-evaluated feature flags across multi-site workspaces.",
    author: "NextPress Analytics",
    homepage: "https://npmjs.com/package/@nextpress/plugin-posthog-insights",
    hooks: ["site:footerBadge"],
    defaultConfig: {
      capturePageview: true,
      respectDoNotTrack: true
    },
    rating: 4.8,
    ratingCount: 88,
    activeInstalls: 21000,
    lastUpdated: "1 week ago",
    testedUpTo: "NextPress 16.4",
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-cloudflare-turnstile",
    displayName: "Cloudflare Turnstile & Bot Shield",
    version: "1.4.0",
    category: "security",
    categoryLabel: "Security & Compliance",
    tags: ["security", "turnstile", "cloudflare", "bot-protection", "captcha"],
    description:
      "Protects authentication endpoints and public forms with invisible, privacy-preserving Cloudflare Turnstile challenges.",
    author: "NextPress Security",
    homepage: "https://npmjs.com/package/@nextpress/plugin-cloudflare-turnstile",
    hooks: ["site:footerBadge"],
    defaultConfig: {
      mode: "managed",
      protectLoginRoute: true,
      protectPublicForms: true
    },
    rating: 4.9,
    ratingCount: 161,
    activeInstalls: 41000,
    lastUpdated: "3 days ago",
    testedUpTo: "NextPress 16.4",
    featured: true,
    popular: true,
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-security-headers",
    displayName: "NextPress Strict CSP & Security Headers",
    version: "1.2.1",
    category: "security",
    categoryLabel: "Security & Compliance",
    tags: ["csp", "security-headers", "hsts", "x-frame-options", "audit"],
    description:
      "Configures Content-Security-Policy, HSTS, Referrer-Policy, and Permissions-Policy headers for public site routes.",
    author: "NextPress Security",
    homepage: "https://npmjs.com/package/@nextpress/plugin-security-headers",
    hooks: ["site:footerBadge"],
    defaultConfig: {
      enableStrictCsp: true,
      frameAncestors: "sameorigin"
    },
    rating: 4.8,
    ratingCount: 94,
    activeInstalls: 22500,
    lastUpdated: "1 week ago",
    testedUpTo: "NextPress 16.4",
    recommended: true
  },
  {
    packageName: "@nextpress/plugin-edge-image-optimizer",
    displayName: "NextPress AVIF/WebP & LCP Image Optimizer",
    version: "1.3.5",
    category: "performance",
    categoryLabel: "Performance & Edge",
    tags: ["images", "avif", "webp", "lcp", "fetchpriority", "performance"],
    description:
      "Automatically prioritizes hero images with fetchpriority='high' and enforces aspect-ratio layout stability to eliminate CLS.",
    author: "NextPress Performance",
    homepage: "https://npmjs.com/package/@nextpress/plugin-edge-image-optimizer",
    hooks: ["site:footerBadge"],
    defaultConfig: {
      autoFetchPriorityHero: true,
      preferAvif: true,
      lazyOffscreenImages: true
    },
    rating: 4.9,
    ratingCount: 128,
    activeInstalls: 33400,
    lastUpdated: "5 days ago",
    testedUpTo: "NextPress 16.4",
    popular: true,
    recommended: true
  }
];

/**
 * Starter packages pre-installed on new NextPress sites.
 */
export const OFFICIAL_NODE_PLUGIN_PACKAGES: NodePluginManifest[] =
  NODE_PLUGIN_DIRECTORY.filter((p) => p.isBuiltInPackage);

const NPM_PACKAGE_REGEX =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function isValidNpmPackageName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 214) return false;
  return NPM_PACKAGE_REGEX.test(trimmed);
}

/**
 * Resolves the category metadata for any installed or directory plugin.
 */
export function resolvePluginCategory(
  packageName: string,
  hooks: PluginHookName[] = []
): { slug: PluginCategorySlug; label: string } {
  const catalogMatch = NODE_PLUGIN_DIRECTORY.find(
    (p) => p.packageName.toLowerCase() === packageName.toLowerCase()
  );
  if (catalogMatch) {
    return { slug: catalogMatch.category, label: catalogMatch.categoryLabel };
  }

  const lower = packageName.toLowerCase();
  for (const cat of PLUGIN_CATEGORIES) {
    if (cat.keywords.some((kw) => lower.includes(kw))) {
      return { slug: cat.slug, label: cat.label };
    }
  }

  if (hooks.includes("seo:extendSchema")) {
    return { slug: "seo", label: "SEO & Schema" };
  }
  if (hooks.includes("content:readingTime")) {
    return { slug: "editorial", label: "Editorial & Content" };
  }
  if (hooks.includes("site:footerBadge")) {
    return { slug: "performance", label: "Performance & Edge" };
  }
  return { slug: "ui", label: "UI & Blocks" };
}

/**
 * Dynamically searches and ranks the Node Plugin Directory by Name, Category, Tag, or Author.
 * Also synthesizes an on-the-fly installable Node package entry if the query is a valid custom npm package name.
 */
export function searchNodePluginDirectory(options: {
  query?: string;
  category?: PluginCategoryFilter;
  browseTab?: PluginBrowseTab;
  searchBy?: PluginSearchField;
}): NodePluginManifest[] {
  const rawQuery = (options.query ?? "").trim();
  const q = rawQuery.toLowerCase();
  const category = options.category ?? "all";
  const browseTab = options.browseTab ?? "all";
  const searchBy = options.searchBy ?? "all";

  const scored: { item: NodePluginManifest; score: number }[] = [];

  for (const item of NODE_PLUGIN_DIRECTORY) {
    // 1. Filter by explicit category pill if selected
    if (category !== "all" && item.category !== category) {
      continue;
    }

    // 2. Filter by browseTab when no search query is active
    if (!q) {
      if (browseTab === "featured" && !item.featured) continue;
      if (browseTab === "popular" && !item.popular) continue;
      if (browseTab === "recommended" && !item.recommended) continue;
      scored.push({ item, score: item.activeInstalls });
      continue;
    }

    // 3. Evaluate dynamic query match across Name, Category, Tag, Author, and Description
    const nameMatch =
      item.displayName.toLowerCase().includes(q) ||
      item.packageName.toLowerCase().includes(q);

    const catMeta = PLUGIN_CATEGORIES.find((c) => c.slug === item.category);
    const categoryMatch =
      item.category.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      Boolean(catMeta?.keywords.some((kw) => kw.includes(q) || q.includes(kw)));

    const tagMatch = item.tags.some((t) => t.toLowerCase().includes(q));
    const authorMatch = item.author.toLowerCase().includes(q);
    const descriptionMatch = item.description.toLowerCase().includes(q);

    let matches = false;
    let score = 0;

    if (searchBy === "name") {
      matches = nameMatch;
      if (nameMatch) score += 100;
    } else if (searchBy === "category") {
      matches = categoryMatch;
      if (categoryMatch) score += 100;
    } else if (searchBy === "tag") {
      matches = tagMatch || categoryMatch;
      if (tagMatch) score += 90;
      if (categoryMatch) score += 60;
    } else if (searchBy === "author") {
      matches = authorMatch;
      if (authorMatch) score += 100;
    } else {
      // "all": search across Name, Category, Tag, Author, and Description simultaneously
      matches =
        nameMatch || categoryMatch || tagMatch || authorMatch || descriptionMatch;
      if (item.displayName.toLowerCase().startsWith(q)) score += 140;
      if (nameMatch) score += 100;
      if (categoryMatch) score += 85;
      if (tagMatch) score += 70;
      if (authorMatch) score += 50;
      if (descriptionMatch) score += 35;
    }

    if (matches) {
      scored.push({ item, score: score + item.activeInstalls / 100000 });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const results = scored.map((entry) => entry.item);

  // If the user typed a valid custom npm package name (e.g., "@acme/plugin-crm" or "nextpress-plugin-algolia")
  // that isn't in the static catalog, synthesize an instant installable card just like npm registry lookup.
  const exactExists = results.some(
    (p) => p.packageName.toLowerCase() === q
  );
  if (q && !exactExists && isValidNpmPackageName(q) && ( q.includes("/") || q.includes("-") || results.length === 0 )) {
    const inferredCategory =
      category !== "all"
        ? PLUGIN_CATEGORIES.find((c) => c.slug === category)!
        : PLUGIN_CATEGORIES.find((c) =>
            c.keywords.some((kw) => q.includes(kw))
          ) ?? PLUGIN_CATEGORIES[2]!;

    const humanTitle = q
      .replace(/^@[^/]+\//, "")
      .replace(/^nextpress-plugin-|^plugin-/, "")
      .split(/[-_.]/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    results.unshift({
      packageName: q,
      displayName: humanTitle || q,
      version: "1.0.0",
      category: inferredCategory.slug,
      categoryLabel: inferredCategory.label,
      tags: ["npm-registry", inferredCategory.slug, "custom-package"],
      description: `Dynamic npm package (${q}) ready to register and activate in this site's NextPress.js plugin runtime.`,
      author: q.startsWith("@") ? q.split("/")[0]! : "npm Registry Author",
      homepage: `https://www.npmjs.com/package/${q}`,
      hooks:
        inferredCategory.slug === "seo"
          ? ["seo:extendSchema"]
          : inferredCategory.slug === "editorial"
            ? ["content:readingTime"]
            : ["site:footerBadge"],
      defaultConfig: {
        enabledInProduction: true
      },
      rating: 4.8,
      ratingCount: 12,
      activeInstalls: 1200,
      lastUpdated: "Just now (npm registry)",
      testedUpTo: "NextPress 16.4"
    });
  }

  return results;
}
