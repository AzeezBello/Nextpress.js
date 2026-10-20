import { DashboardShell } from "@/components/dashboard-shell";
import { SiteSettingsForm } from "@/components/site-settings-form";
import { requireSession } from "@/lib/auth";
import { listSiteMembers, listTaxonomies } from "@/lib/db";

export default async function SettingsPage() {
  const session = await requireSession();
  const members = listSiteMembers(session.activeSite.id);
  const taxonomies = listTaxonomies(session.activeSite.id);

  return (
    <DashboardShell
      active="/settings"
      title="Settings"
      description="Configure site identity, design system tokens, default SEO, and role memberships."
    >
      <SiteSettingsForm
        site={session.activeSite}
        userRole={session.role}
        members={members}
        taxonomies={taxonomies}
      />
    </DashboardShell>
  );
}
