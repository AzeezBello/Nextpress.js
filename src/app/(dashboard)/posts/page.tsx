import { DashboardShell } from "@/components/dashboard-shell";
import { ContentTable } from "@/components/content-table";
import { requireSession } from "@/lib/auth";
import { listContentItems } from "@/lib/db";

export default async function PostsPage() {
  const session = await requireSession();
  const posts = listContentItems(session.activeSite.id, { kind: "post" });

  return (
    <DashboardShell
      active="/posts"
      title="Posts"
      description="Manage editorial articles, categories, revisions, and publication status."
    >
      <ContentTable
        kind="post"
        items={posts}
        siteSlug={session.activeSite.slug}
        userRole={session.role}
      />
    </DashboardShell>
  );
}
