import { Plus, Search } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function PagesPage() {
  return (
    <DashboardShell active="/pages" title="Pages" description="Manage static pages for your site.">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h2 className="text-xl font-semibold">All pages</h2><p className="mt-1 text-sm text-muted">This route is a UI placeholder; page CRUD is not connected.</p></div>
        <button type="button" disabled className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white opacity-60"><Plus size={17} /> New page (not wired)</button>
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted"><Search size={16} /><span>Search pages will be implemented with persisted content.</span></div>
      <div className="mt-5 rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <h3 className="font-semibold">Your pages will appear here</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">The next implementation step is to connect a data layer and build validated create, edit, delete, preview, and publish actions.</p>
      </div>
    </DashboardShell>
  );
}
