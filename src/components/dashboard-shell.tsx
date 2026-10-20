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
        <header className="flex flex-col gap-4 border-b border-line bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
              {session.activeSite.name} / {title}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Role Switcher for testing RBAC */}
            <div className="flex items-center gap-1 rounded-xl border border-line bg-canvas p-1">
              <span className="inline-flex items-center gap-1 px-2 text-[11px] font-semibold text-muted">
                <Shield size={12} className="text-brand" aria-hidden="true" />
                Role:
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition ${
                        isActiveUser
                          ? "bg-brand text-white"
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
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-1.5">
              <div
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E8D9C9] text-xs font-semibold text-ink"
                aria-hidden="true"
              >
                {session.user.avatarInitials}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-none text-ink">
                  {session.user.name}
                </p>
                <p className="mt-1 text-[11px] leading-none text-muted">
                  {session.user.email}
                </p>
              </div>
              <form action={signOutAction}>
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  className="ml-1 rounded-lg p-1.5 text-muted transition hover:bg-canvas hover:text-red-600"
                >
                  <LogOut size={16} aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
        </header>
        <div className="p-5 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
