import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getPublishedContentBySlug,
  getSiteBySlug,
  listPublishedContentForSite,
  listSitePlugins,
  listTaxonomies,
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
  const resolved = getPublishedContentBySlug(siteSlug, "post", slug);
  if (!resolved) {
    return { title: "Post Not Found", robots: { index: false, follow: false } };
  }

  const { site, item } = resolved;
  const rawTitle =
    item.seo.metaTitle ||
    site.seoDefaults.titleTemplatePost ||
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
      type: "article",
      publishedTime: item.publishedAt ?? undefined,
      images: item.seo.ogImage ? [item.seo.ogImage] : undefined
    },
    twitter: {
      card: item.seo.twitterCard ?? "summary_large_image",
      title: item.seo.ogTitle || title,
      description: item.seo.ogDescription || description
    }
  };
}

export default async function PublicBlogPostPage({
  params
}: {
  params: Promise<{ siteSlug: string; slug: string }>;
}) {
  const { siteSlug, slug } = await params;
  const requestPath = `/s/${siteSlug}/blog/${slug}`;
  const site = getSiteBySlug(siteSlug);
  if (!site) {
    notFound();
  }

  // 1. Check Redirect Manager rules first
  const matchedRedirect = matchRedirectForPath(site.id, requestPath);
  if (matchedRedirect && matchedRedirect.resolvedDestination) {
    if (matchedRedirect.redirect.statusCode === 301) {
      permanentRedirect(matchedRedirect.resolvedDestination);
    }
    redirect(matchedRedirect.resolvedDestination);
  }

  const resolved = getPublishedContentBySlug(siteSlug, "post", slug);

  // 2. Log 404 hits before calling notFound()
  if (!resolved) {
    logNotFoundHit({
      siteId: site.id,
      path: requestPath,
      referrer: "Public Blog Visitor Request"
    });
    notFound();
  }

  const { item, renderDocument } = resolved;
  const navPages = listPublishedContentForSite(site.id, "page");
  const allTaxonomies = listTaxonomies(site.id);
  const postTaxonomies = allTaxonomies.filter((t) => item.taxonomyIds.includes(t.id));
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
    <PublicSiteShell site={site} navPages={navPages}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
      />

      <div className="mb-6">
        <Link
          href={`/s/${site.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to {site.name}
        </Link>
      </div>

      <article className="rounded-3xl border border-line bg-white p-8 shadow-soft sm:p-12">
        <header className="mb-8 border-b border-line pb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>By {item.authorName}</span>
            {item.publishedAt ? (
              <span>
                · Published{" "}
                {new Date(item.publishedAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                })}
              </span>
            ) : null}
            {readingTimePlugin ? (
              <>
                <span>·</span>
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 font-semibold text-brand">
                  {seoStats.stats.readingTimeMinutes} min read
                </span>
                {readingTimePlugin.config.showWordCount !== false ? (
                  <span>({seoStats.stats.wordCount} words)</span>
                ) : null}
              </>
            ) : null}
          </div>
          {postTaxonomies.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {postTaxonomies.map((tax) => (
                <span
                  key={tax.id}
                  className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand"
                >
                  {tax.name}
                </span>
              ))}
            </div>
          ) : null}
        </header>

        <BlockDocumentRenderer document={renderDocument} />
      </article>
    </PublicSiteShell>
  );
}
