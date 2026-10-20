import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getPublishedContentBySlug,
  listPublishedContentForSite
} from "@/lib/db";
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
  const title = item.seo.metaTitle || `${item.title} | ${site.name}`;
  const description = item.seo.metaDescription || item.excerpt || site.description;

  return {
    title,
    description,
    alternates: item.seo.canonicalUrl ? { canonical: item.seo.canonicalUrl } : undefined,
    robots: item.seo.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      type: "website"
    }
  };
}

export default async function PublicContentPage({
  params
}: {
  params: Promise<{ siteSlug: string; slug: string }>;
}) {
  const { siteSlug, slug } = await params;
  const resolved = getPublishedContentBySlug(siteSlug, "page", slug);

  // Strict guardrail: unpublished or non-existent slugs return 404
  if (!resolved) {
    notFound();
  }

  const { site, item, renderDocument } = resolved;
  const navPages = listPublishedContentForSite(site.id, "page");

  return (
    <PublicSiteShell site={site} navPages={navPages} activeSlug={item.slug}>
      <article className="rounded-3xl border border-line bg-white p-8 shadow-soft sm:p-12">
        <BlockDocumentRenderer document={renderDocument} />
      </article>
    </PublicSiteShell>
  );
}
