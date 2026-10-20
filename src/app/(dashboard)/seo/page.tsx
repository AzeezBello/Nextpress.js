import { DashboardShell } from "@/components/dashboard-shell";
import { SeoHub } from "@/components/seo-hub";
import { requireSession } from "@/lib/auth";
import { listContentItems, listNotFoundLogs, listRedirects } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export default async function SeoSuitePage() {
  const session = await requireSession();
  const contentItems = listContentItems(session.activeSite.id);
  const redirects = listRedirects(session.activeSite.id);
  const notFoundLogs = listNotFoundLogs(session.activeSite.id);

  const canPublish = hasPermission(session.role, "content:publish");
  const canManageSite = hasPermission(session.role, "site:manage");

  return (
    <DashboardShell
      active="/seo"
      title="SEO Command Center"
      description={`Built-in Rank Math, Yoast SEO, and AIOSEO intelligence for ${session.activeSite.name}.`}
    >
      <SeoHub
        site={session.activeSite}
        contentItems={contentItems}
        redirects={redirects}
        notFoundLogs={notFoundLogs}
        canPublish={canPublish}
        canManageSite={canManageSite}
      />
    </DashboardShell>
  );
}
