import type { ReactNode } from "react";
import { LogOut, Shield } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { requireSession } from "@/lib/auth";
import { listDemoUsers } from "@/lib/db";
import { quickDemoSignInAction, signOutAction } from "@/lib/actions";

export async function DashboardShell({
  active,
  title,
  description,
  children
}: {
  active: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const session = await requireSession();
  const demoUsers = listDemoUsers();

  return (
    <div className="min-h-screen md:flex">
      <SidebarNav active={active} session={session} />
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-line bg-white/90 px-5 py-4 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                {session.activeSite.name}
              </span>
              <span className="text-xs text-muted">/</span>
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {title}
              </span>
            </div>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {title}
            </h1>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Role Switcher for testing 5-tier RBAC */}
            <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-line bg-canvas p-1">
              <span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-muted">
                <Shield size={12} className="text-brand" aria-hidden="true" />
                Persona:
              </span>
              {demoUsers.map((u) => {
                const isActiveUser = u.id === session.user.id;
                return (
                  <form key={u.id} action={quickDemoSignInAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="returnTo" value={active} />
                    <button
                      type="submit"
                      disabled={isActiveUser}
                      title={`Switch to ${u.name} (${u.primaryRole})`}
                      className={`rounded-xl px-2.5 py-1 text-xs font-semibold capitalize transition ${
                        isActiveUser
                          ? "bg-brand text-white shadow-2xs"
                          : "text-muted hover:bg-white hover:text-ink"
                      }`}
                    >
                      {u.primaryRole}
                    </button>
                  </form>
                );
              })}
            </div>

            {/* Active User Badge & Sign Out */}
            <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-white px-3 py-1.5 shadow-2xs">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
                aria-hidden="true"
              >
                {session.user.avatarInitials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-none text-ink">
                  {session.user.name}
                </p>
                <p className="mt-1 font-mono text-[11px] leading-none text-muted">
                  {session.user.email}
                </p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  className="ml-1 rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-danger"
                >
                  <LogOut size={15} aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1440px] p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
