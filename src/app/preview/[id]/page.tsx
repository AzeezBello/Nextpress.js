import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Eye, Lock } from "lucide-react";
import { requireSession } from "@/lib/auth";
import {
  getContentItemById,
  getSiteById,
   getUserRoleForSite,
  listPublishedContentForSite
} from "@/lib/db";
import { PublicSiteShell } from "@/components/public-site-shell";
import { BlockDocumentRenderer } from "@/components/block-renderer";

export const metadata: Metadata = {
  title: "Private Draft Preview",
  robots: { index: false, follow: false }
};

export default async function PrivatePreviewPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();

  // Verify the user has membership access to the active site and that the item belongs to it
  const item = getContentItemById(session.activeSite.id, id);
  if (!item) {
    notFound();
  }

  const role = getUserRoleForSite(session.user.id, item.siteId);
  if (!role) {
    notFound();
  }

  const site = getSiteById(item.siteId)!;
  const navPages = listPublishedContentForSite(site.id, "page");

  const previewBanner = (
    <div className="sticky top-0 z-50 border-b border-white/15 bg-ink px-6 py-3 text-white shadow-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 font-semibold text-white">
            <Lock size={12} aria-hidden="true" />
            Protected Preview
          </span>
          <span>
            Viewing working draft of <strong>{item.title}</strong> ({item.status})
          </span>
          <span className="hidden text-white/70 sm:inline">
            · Signed in as {session.user.name} ({role})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${item.kind}s/${item.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-semibold text-ink transition hover:bg-brand-soft"
          >
            <ArrowLeft size={13} aria-hidden="true" />
            Back to Block Editor
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <PublicSiteShell
      site={site}
      navPages={navPages}
      activeSlug={item.slug}
      previewBanner={previewBanner}
    >
      <article className="rounded-3xl border border-line bg-white p-8 shadow-soft sm:p-12">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-wider text-brand">
            <Eye size={14} aria-hidden="true" />
            {item.kind} preview · Schema v{item.document.schemaVersion}
          </span>
          <span>Last saved {new Date(item.updatedAt).toLocaleString()}</span>
        </div>
        <BlockDocumentRenderer document={item.document} />
      </article>
    </PublicSiteShell>
  );
}
