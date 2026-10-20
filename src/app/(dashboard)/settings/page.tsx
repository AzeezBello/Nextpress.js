import { DashboardShell } from "@/components/dashboard-shell";

export default function SettingsPage() {
  return (
    <DashboardShell active="/settings" title="Settings" description="Configure your site and workspace.">
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          ["Site identity", "Site name, URL, branding and metadata."],
          ["Design system", "Colors, typography, spacing and reusable tokens."],
          ["Access control", "Users, memberships and role permissions."],
          ["Integrations", "Storage, email and future extension settings."]
        ].map(([title, description]) => (
          <section key={title} className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            <p className="mt-4 text-xs font-medium text-muted">Planned — not wired</p>
          </section>
        ))}
      </div>
    </DashboardShell>
  );
}
