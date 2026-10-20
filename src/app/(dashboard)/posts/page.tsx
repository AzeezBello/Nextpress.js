import { DashboardShell } from "@/components/dashboard-shell";

export default function PostsPage() {
  return (
    <DashboardShell active="/posts" title="Posts" description="Manage editorial content and publication status.">
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <h2 className="text-xl font-semibold">Posts are not connected yet</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Implement post persistence, taxonomies, slugs, draft/published states, revisions, and public rendering as part of the CMS foundation.</p>
      </div>
    </DashboardShell>
  );
}
