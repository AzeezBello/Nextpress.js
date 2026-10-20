import { DashboardShell } from "@/components/dashboard-shell";
import { AppearanceStudio } from "@/components/appearance-studio";
import { requireSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function AppearancePage() {
  const session = await requireSession();
  const canManageSite = hasPermission(session.role, "site:manage");

  return (
    <DashboardShell
      active="/appearance"
      title="Appearance & Themes"
      description={`Customize visual themes, typography stacks, and design tokens for ${session.activeSite.name}.`}
    >
      <AppearanceStudio site={session.activeSite} canManageSite={canManageSite} />
    </DashboardShell>
  );
}
