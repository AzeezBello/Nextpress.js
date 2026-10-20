import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { BlockEditor } from "@/components/block-editor";
import { requireSession } from "@/lib/auth";
import {
  getContentItemById,
  listMediaAssets,
  listRevisions,
  listTaxonomies
} from "@/lib/db";
import { canEditContent } from "@/lib/permissions";

export default async function EditPageRoute({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const item = getContentItemById(session.activeSite.id, id);

  if (!item || item.kind !== "page") {
    notFound();
  }

  const canEdit = canEditContent(session.role, session.user.id, item.authorId);
  const revisions = listRevisions(session.activeSite.id, item.id);
  const mediaAssets = listMediaAssets(session.activeSite.id);
  const taxonomies = listTaxonomies(session.activeSite.id);

  return (
    <DashboardShell
      active="/pages"
      title={`Edit Page: ${item.title}`}
      description={`Schema v${item.document.schemaVersion} · Author: ${item.authorName}`}
    >
      <BlockEditor
        item={item}
        siteSlug={session.activeSite.slug}
        userRole={session.role}
        canEdit={canEdit}
        revisions={revisions}
        mediaAssets={mediaAssets}
        taxonomies={taxonomies}
      />
    </DashboardShell>
  );
}
