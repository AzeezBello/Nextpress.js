export type PluginHookName =
  | "site:headerBanner"
  | "content:readingTime"
  | "block:codeEnhance"
  | "site:footerBadge"
  | "seo:extendSchema"
  | "block:register";

export type NodePluginManifest = {
  packageName: string;
  displayName: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  hooks: PluginHookName[];
  defaultConfig: Record<string, string | boolean | number>;
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

export const OFFICIAL_NODE_PLUGIN_PACKAGES: NodePluginManifest[] = [
  {
    packageName: "@nextpress/plugin-announcement-bar",
    displayName: "NextPress Announcement Bar",
    version: "1.2.0",
    description:
      "Renders a customizable top announcement banner across public site routes with CTA link support.",
    author: "NextPress Core Team",
    homepage: "https://npmjs.com/package/@nextpress/plugin-announcement-bar",
    hooks: ["site:headerBanner"],
    defaultConfig: {
      bannerText: "NextPress.js 2026 Release — Built-in Rank Math, Yoast & AIOSEO Intelligence is live!",
      ctaLabel: "Explore Features",
      ctaHref: "/s/flagship/about"
    },
    isBuiltInPackage: true
  },
  {
    packageName: "@nextpress/plugin-reading-time",
    displayName: "NextPress Reading Time & Word Counter",
    version: "1.1.4",
    description:
      "Calculates words-per-minute reading time from canonical ContentDocument blocks and displays a badge on public pages and posts.",
    author: "NextPress Core Team",
    homepage: "https://npmjs.com/package/@nextpress/plugin-reading-time",
    hooks: ["content:readingTime"],
    defaultConfig: {
      wordsPerMinute: 200,
      showWordCount: true
    },
    isBuiltInPackage: true
  },
  {
    packageName: "@nextpress/plugin-prism-syntax",
    displayName: "NextPress Code Block Enhancer",
    version: "2.0.1",
    description:
      "Enhances structured code blocks with language headers, line count indicators, and terminal chrome.",
    author: "NextPress Labs",
    homepage: "https://npmjs.com/package/@nextpress/plugin-prism-syntax",
    hooks: ["block:codeEnhance"],
    defaultConfig: {
      showLineCount: true,
      terminalHeader: true
    },
    isBuiltInPackage: true
  },
  {
    packageName: "@nextpress/plugin-web-vitals",
    displayName: "NextPress Core Web Vitals Badge",
    version: "1.0.8",
    description:
      "Adds a lightweight Core Web Vitals & carbon-aware edge rendering badge to the public site footer.",
    author: "NextPress Performance",
    homepage: "https://npmjs.com/package/@nextpress/plugin-web-vitals",
    hooks: ["site:footerBadge"],
    defaultConfig: {
      badgeLabel: "CWV Passing · Zero Client JS Overhead"
    },
    isBuiltInPackage: true
  }
];

const NPM_PACKAGE_REGEX =
  /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

export function isValidNpmPackageName(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 214) return false;
  return NPM_PACKAGE_REGEX.test(trimmed);
}
