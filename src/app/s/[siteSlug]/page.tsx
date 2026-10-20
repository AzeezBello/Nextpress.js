import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpenText } from "lucide-react";
import {
  getPublishedContentBySlug,
  getSiteBySlug,
  listPublishedContentForSite
} from "@/lib/db";
import { buildSchemaGraph, resolveSmartTags } from "@/lib/seo-engine";
import { PublicSiteShell } from "@/components/public-site-shell";
import { BlockDocumentRenderer } from "@/components/block-renderer";

export async function generateMetadata({
  params
}: {
  params: Promise<{ siteSlug: string }>;
}): Promise<Metadata> {
  const { siteSlug } = await params;
  const site = getSiteBySlug(siteSlug);
  if (!site) return { title: "Site Not Found" };

  const homePublished = getPublishedContentBySlug(siteSlug, "page", "home");
  const rawTitle =
    homePublished?.item.seo.metaTitle ||
    site.seoDefaults.metaTitle ||
    site.seoDefaults.titleTemplatePage ||
    site.name;
  const title = resolveSmartTags(rawTitle, {
    title: homePublished?.item.title || site.name,
    excerpt: homePublished?.item.excerpt || site.description,
    siteName: site.name,
    tagline: site.tagline,
    separator: site.seoDefaults.titleSeparator || "—",
    authorName: homePublished?.item.authorName
  });

  const description =
    homePublished?.item.seo.metaDescription ||
    site.seoDefaults.metaDescription ||
    site.description;

  return {
    title,
    description,
    alternates: site.seoDefaults.canonicalUrl
      ? { canonical: site.seoDefaults.canonicalUrl }
      : undefined,
    openGraph: {
      title: homePublished?.item.seo.ogTitle || title,
      description: homePublished?.item.seo.ogDescription || description,
      type: "website",
      images: homePublished?.item.seo.ogImage ? [homePublished.item.seo.ogImage] : undefined
    }
  };
}

export default async function PublicSiteHomePage({
  params
}: {
  params: Promise<{ siteSlug: string }>;
}) {
  const { siteSlug } = await params;
  const site = getSiteBySlug(siteSlug);
  if (!site) {
    notFound();
  }

  const navPages = listPublishedContentForSite(site.id, "page");
  const publishedPosts = listPublishedContentForSite(site.id, "post");
  const homePublished = getPublishedContentBySlug(siteSlug, "page", "home");

  const schemaGraph = homePublished
    ? buildSchemaGraph({
        site,
        item: {
          ...homePublished.item,
          document: homePublished.renderDocument
        },
        baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      })
    : null;

  return (
    <PublicSiteShell site={site} navPages={navPages} activeSlug="home">
      {schemaGraph ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }}
        />
      ) : null}

      {homePublished ? (
        <article className="rounded-3xl border border-line bg-white p-8 shadow-soft sm:p-12">
          <BlockDocumentRenderer document={homePublished.renderDocument} />
        </article>
      ) : (
        <section className="rounded-3xl border border-line bg-white p-8 text-center shadow-soft sm:p-12">
          <h1 className="text-3xl font-semibold text-ink">{site.name}</h1>
          <p className="mt-2 text-muted">{site.description}</p>
        </section>
      )}

      {publishedPosts.length > 0 ? (
        <section className="mt-12">
          <div className="flex items-center gap-2">
            <BookOpenText size={18} className="text-brand" aria-hidden="true" />
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Latest Published Posts
            </h2>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {publishedPosts.map((post) => (
              <Link
                key={post.id}
                href={`/s/${site.slug}/blog/${post.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:border-brand"
              >
                <div>
                  <p className="text-xs text-muted">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })
                      : "Published"}{" "}
                    · {post.authorName}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-ink group-hover:text-brand">
                    {post.title}
                  </h3>
                  {post.excerpt ? (
                    <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>
                  ) : null}
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                  Read article <ArrowRight size={14} aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PublicSiteShell>
  );
}
