import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  getPublishedContentBySlug,
  listPublishedContentForSite,
  listTaxonomies
} from "@/lib/db";
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
      type: "article",
      publishedTime: item.publishedAt ?? undefined
    }
  };
}

export default async function PublicBlogPostPage({
  params
}: {
  params: Promise<{ siteSlug: string; slug: string }>;
}) {
  const { siteSlug, slug } = await params;
  const resolved = getPublishedContentBySlug(siteSlug, "post", slug);

  if (!resolved) {
    notFound();
  }

  const { site, item, renderDocument } = resolved;
  const navPages = listPublishedContentForSite(site.id, "page");
  const allTaxonomies = listTaxonomies(site.id);
  const postTaxonomies = allTaxonomies.filter((t) => item.taxonomyIds.includes(t.id));

  return (
    <PublicSiteShell site={site} navPages={navPages}>
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
