import { DashboardShell } from "@/components/dashboard-shell";
import { MediaManager } from "@/components/media-manager";
import { requireSession } from "@/lib/auth";
import { listMediaAssets } from "@/lib/db";

export default async function MediaPage() {
  const session = await requireSession();
  const assets = listMediaAssets(session.activeSite.id);

  return (
    <DashboardShell
      active="/media"
      title="Media library"
      description="Manage images, vector graphics, alt text, and storage metadata for your site."
    >
      <MediaManager assets={assets} userRole={session.role} />
    </DashboardShell>
  );
}
