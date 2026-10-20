import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import {
  getPublishedContentBySlug,
  getSiteBySlug,
  listPublishedContentForSite,
  listSitePlugins,
  logNotFoundHit,
  matchRedirectForPath
} from "@/lib/db";
import {
  analyzeSeoAndReadability,
  buildSchemaGraph,
  resolveSmartTags
} from "@/lib/seo-engine";
import { PublicSiteShell } from "@/components/public-site-shell";
import { BlockDocumentRenderer } from "@/components/block-renderer";

export async function generateMetadata({
  params
}: {
  params: Promise<{ siteSlug: string; slug: string }>;
}): Promise<Metadata> {
  const { siteSlug, slug } = await params;
  const resolved = getPublishedContentBySlug(siteSlug, "page", slug);
  if (!resolved) {
    return { title: "Page Not Found", robots: { index: false, follow: false } };
  }

  const { site, item } = resolved;
  const rawTitle =
    item.seo.metaTitle ||
    site.seoDefaults.titleTemplatePage ||
    "%%title%% %%sep%% %%sitename%%";
  const title = resolveSmartTags(rawTitle, {
    title: item.title,
    excerpt: item.excerpt || site.description,
    siteName: site.name,
    tagline: site.tagline,
    separator: site.seoDefaults.titleSeparator || "—",
    authorName: item.authorName
  });
  const description = item.seo.metaDescription || item.excerpt || site.description;

  return {
    title,
    description,
    alternates: item.seo.canonicalUrl ? { canonical: item.seo.canonicalUrl } : undefined,
    robots: {
      index: !item.seo.noIndex,
      follow: !item.seo.noFollow,
      noarchive: Boolean(item.seo.noArchive),
      nosnippet: Boolean(item.seo.noSnippet),
      "max-image-preview": item.seo.maxImagePreview ?? "large"
    },
    openGraph: {
      title: item.seo.ogTitle || title,
      description: item.seo.ogDescription || description,
      type: "website",
      images: item.seo.ogImage ? [item.seo.ogImage] : undefined
    },
    twitter: {
      card: item.seo.twitterCard ?? "summary_large_image",
      title: item.seo.ogTitle || title,
      description: item.seo.ogDescription || description
    }
  };
}

export default async function PublicContentPage({
  params
}: {
  params: Promise<{ siteSlug: string; slug: string }>;
}) {
  const { siteSlug, slug } = await params;
  const requestPath = `/s/${siteSlug}/${slug}`;
  const site = getSiteBySlug(siteSlug);
  if (!site) {
    notFound();
  }

  // 1. Check Rank Math / Yoast Redirect Manager rules first
  const matchedRedirect = matchRedirectForPath(site.id, requestPath);
  if (matchedRedirect && matchedRedirect.resolvedDestination) {
    if (matchedRedirect.redirect.statusCode === 301) {
      permanentRedirect(matchedRedirect.resolvedDestination);
    }
    redirect(matchedRedirect.resolvedDestination);
  }

  const resolved = getPublishedContentBySlug(siteSlug, "page", slug);

  // 2. Strict guardrail: unpublished or non-existent slugs log to 404 Monitor and return 404
  if (!resolved) {
    logNotFoundHit({
      siteId: site.id,
      path: requestPath,
      referrer: "Public Visitor Request"
    });
    notFound();
  }

  const { item, renderDocument } = resolved;
  const navPages = listPublishedContentForSite(site.id, "page");
  const activePlugins = listSitePlugins(site.id).filter((p) => p.enabled);
  const readingTimePlugin = activePlugins.find((p) => p.hooks.includes("content:readingTime"));

  const seoStats = analyzeSeoAndReadability({
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    kind: item.kind,
    document: renderDocument,
    seo: item.seo,
    siteName: site.name,
    siteTagline: site.tagline
  });

  const schemaGraph = buildSchemaGraph({
    site,
    item: {
      ...item,
      document: renderDocument
    },
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  });

  return (
    <PublicSiteShell site={site} navPages={navPages} activeSlug={item.slug}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />
      <article className="rounded-3xl border border-line bg-white p-8 shadow-soft sm:p-12">
        {readingTimePlugin ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-line pb-4 text-xs text-muted">
            <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-semibold text-brand">
              {seoStats.stats.readingTimeMinutes} min read
            </span>
            {readingTimePlugin.config.showWordCount !== false ? (
              <span>· {seoStats.stats.wordCount} words</span>
            ) : null}
          </div>
        ) : null}
        <BlockDocumentRenderer document={renderDocument} />
      </article>
    </PublicSiteShell>
  );
}
