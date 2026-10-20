import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Layers3, ShieldCheck } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { listDemoUsers } from "@/lib/db";
import { ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { quickDemoSignInAction } from "@/lib/actions";
import { SignInForm } from "@/components/sign-in-form";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/dashboard");
  }

  const demoUsers = listDemoUsers();

  return (
    <main className="min-h-screen bg-canvas px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand text-white">
              <Layers3 size={21} aria-hidden="true" />
            </span>
            <span className="text-lg">
              NextPress<span className="text-brand">.js</span>
            </span>
          </Link>
          <Link
            href="/s/flagship"
            className="text-sm font-medium text-muted hover:text-brand"
          >
            View public flagship site →
          </Link>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          {/* Left: Standard Sign-In Form */}
          <section className="rounded-3xl border border-line bg-white p-7 shadow-soft sm:p-9">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">
              <ShieldCheck size={14} aria-hidden="true" />
              Workspace Authentication
            </span>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
              Sign in to NextPress
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">
              Enter your workspace credentials. Default demo password is{" "}
              <code className="rounded bg-canvas px-1.5 py-0.5 font-mono text-ink">
                nextpress123
              </code>
              .
            </p>

            <div className="mt-6">
              <SignInForm />
            </div>
          </section>

          {/* Right: Instant Role Persona Switcher */}
          <section className="rounded-3xl border border-line bg-white p-7 sm:p-9">
            <h2 className="text-lg font-semibold">Instant Role-Based Demo Sign-In</h2>
            <p className="mt-1.5 text-sm leading-6 text-muted">
              Test server-side authorization and role guardrails immediately with pre-seeded accounts:
            </p>

            <div className="mt-5 space-y-3">
              {demoUsers.map((user) => {
                const roleMeta = ROLE_DESCRIPTIONS[user.primaryRole];
                return (
                  <form key={user.id} action={quickDemoSignInAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="returnTo" value="/dashboard" />
                    <button
                      type="submit"
                      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-line bg-canvas p-4 text-left transition hover:border-brand hover:bg-brand-soft/40"
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#E8D9C9] text-xs font-semibold text-ink">
                          {user.avatarInitials}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{user.name}</span>
                            <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
                              {roleMeta.label}
                            </span>
                          </div>
                          <p className="mt-0.5 font-mono text-xs text-muted">{user.email}</p>
                          <p className="mt-1 text-xs leading-5 text-muted">
                            {roleMeta.summary}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        size={17}
                        className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-brand"
                        aria-hidden="true"
                      />
                    </button>
                  </form>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
