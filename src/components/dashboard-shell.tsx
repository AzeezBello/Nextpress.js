import type { ReactNode } from "react";
import { Bell, Search } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";

export function DashboardShell({ active, title, description, children }: {
  active: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen md:flex">
      <SidebarNav active={active} />
      <main className="min-w-0 flex-1">
        <header className="flex flex-col gap-4 border-b border-line bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">Workspace / {title}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-muted">
              <Search size={16} aria-hidden="true" />
              <span className="sr-only">Search</span>
              <input className="w-full min-w-0 bg-transparent outline-none placeholder:text-muted" placeholder="Search (demo)" />
            </label>
            <button type="button" aria-label="Notifications (demo)" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-line bg-white text-muted hover:bg-canvas">
              <Bell size={17} aria-hidden="true" />
            </button>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E8D9C9] text-sm font-semibold text-ink" aria-label="Demo profile">NP</div>
          </div>
        </header>
        <div className="p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
