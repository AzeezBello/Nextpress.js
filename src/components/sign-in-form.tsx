"use client";

import React, { useActionState } from "react";
import { signInAction } from "@/lib/actions";

export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-medium text-red-800"
        >
          {state.error}
        </div>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          autoComplete="username"
          spellCheck={false}
          required
          defaultValue="ada@nextpress.dev"
          placeholder="ada@nextpress.dev"
          className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink focus:border-brand"
        />
      </div>

      <div>
        <label
          htmlFor="current-password"
          className="block text-xs font-semibold uppercase tracking-wider text-muted"
        >
          Password
        </label>
        <input
          type="password"
          id="current-password"
          name="password"
          autoComplete="current-password"
          enterKeyHint="done"
          required
          defaultValue="nextpress123"
          className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink focus:border-brand"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-brand px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-ink disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
