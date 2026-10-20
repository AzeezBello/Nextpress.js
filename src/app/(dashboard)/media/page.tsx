import { ImagePlus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

export default function MediaPage() {
  return (
    <DashboardShell active="/media" title="Media library" description="Manage images and files used by your content.">
      <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand"><ImagePlus size={22} /></span>
        <h2 className="mt-4 text-xl font-semibold">Your media library starts here</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Uploads are not implemented. Add authenticated upload handling, file type and size limits, object storage, metadata, alt text, and cleanup policies before enabling uploads.</p>
      </div>
    </DashboardShell>
  );
}
