import { DashboardShell } from "@/components/dashboard-shell";
import { ContentTable } from "@/components/content-table";
import { requireSession } from "@/lib/auth";
import { listContentItems } from "@/lib/db";

export default async function PagesPage() {
  const session = await requireSession();
  const pages = listContentItems(session.activeSite.id, { kind: "page" });

  return (
    <DashboardShell
      active="/pages"
      title="Pages"
      description="Create, edit, preview, and publish structured pages for your site."
    >
      <ContentTable
        kind="page"
        items={pages}
        siteSlug={session.activeSite.slug}
        userRole={session.role}
      />
    </DashboardShell>
  );
}
