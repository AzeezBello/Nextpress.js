import Link from "next/link";
import { ArrowUpRight, FileText, Image, Layers3, Plus } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";

const stats = [
  { label: "Published pages", value: "08", note: "Sample data", icon: Layers3 },
  { label: "Posts", value: "12", note: "Sample data", icon: FileText },
  { label: "Media assets", value: "24", note: "Sample data", icon: Image }
];

export default function DashboardPage() {
  return (
    <DashboardShell active="/dashboard" title="Overview" description="A starting point for your publishing workspace.">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted">Monday, workspace preview</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Good work starts with a clear canvas.</h2>
          <p className="mt-2 max-w-2xl leading-6 text-muted">Your dashboard is currently populated with sample data. Connect authentication and persistence before using it for real content.</p>
        </div>
        <Link href="/pages" className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink">
          <Plus size={17} aria-hidden="true" /> Create a page
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand"><Icon size={19} aria-hidden="true" /></span>
              <span className="text-xs text-muted">{note}</span>
            </div>
            <p className="mt-5 text-3xl font-semibold tracking-tight">{value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h3 className="font-semibold">Recent content</h3>
            <p className="mt-1 text-sm text-muted">Illustrative examples, not stored content.</p>
          </div>
          <Link href="/pages" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">View pages <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
        <div className="divide-y divide-line">
          {[
            { title: "Welcome to your new site", type: "Page", status: "Published", date: "Today" },
            { title: "Our story", type: "Page", status: "Draft", date: "Yesterday" },
            { title: "Ideas worth sharing", type: "Post", status: "Draft", date: "Oct 12" }
          ].map((item) => (
            <div key={item.title} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_100px_110px_90px] sm:items-center">
              <div className="font-medium">{item.title}<p className="mt-1 text-xs font-normal text-muted">{item.type}</p></div>
              <span className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${item.status === "Published" ? "bg-brand-soft text-brand" : "bg-[#F8EBD9] text-[#8A5A20]"}`}>{item.status}</span>
              <span className="text-sm text-muted">{item.date}</span>
              <span className="text-xs text-muted">Sample only</span>
            </div>
          ))}
        </div>
      </section>
      <p className="mt-5 rounded-xl border border-dashed border-line p-4 text-sm leading-6 text-muted">
        Next milestone: connect a database and authentication, then make the create → edit → preview → publish flow work end-to-end.
      </p>
    </DashboardShell>
  );
}
