import fs from "node:fs";
import path from "node:path";
import { DashboardShell } from "@/components/dashboard-shell";
import { PluginsManager } from "@/components/plugins-manager";
import { requireSession } from "@/lib/auth";
import { listSitePlugins } from "@/lib/db";
import { hasPermission } from "@/lib/permissions";

export default async function PluginsPage() {
  const session = await requireSession();
  const plugins = listSitePlugins(session.activeSite.id);
  const canManageSite = hasPermission(session.role, "site:manage");

  let workspaceDependencies: Record<string, string> = {};
  try {
    const pkgPath = path.join(process.cwd(), "package.json");
    const raw = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    workspaceDependencies = {
      ...(raw.dependencies ?? {}),
      ...(raw.devDependencies ?? {})
    };
  } catch {
    workspaceDependencies = {
      next: "^16.4.2",
      react: "^19.0.0",
      "lucide-react": "^0.468.0"
    };
  }

  return (
    <DashboardShell
      active="/plugins"
      title="Node Package Plugins"
      description={`Manage npm-based extension packages and runtime hooks for ${session.activeSite.name}.`}
    >
      <PluginsManager
        plugins={plugins}
        workspaceDependencies={workspaceDependencies}
        canManageSite={canManageSite}
        siteSlug={session.activeSite.slug}
      />
    </DashboardShell>
  );
}
