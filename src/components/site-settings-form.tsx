"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Palette, Plus, Save, Shield, Tag } from "lucide-react";
import type { SiteRecord, SiteRole, TaxonomyRecord, ThemeSettings } from "@/lib/content-types";
import { hasPermission, ROLE_DESCRIPTIONS } from "@/lib/permissions";
import { createTaxonomyAction, saveSiteSettingsAction } from "@/lib/actions";

export function SiteSettingsForm({
  site,
  userRole,
  members,
  taxonomies
}: {
  site: SiteRecord;
  userRole: SiteRole;
  members: Array<{
    membershipId: string;
    userId: string;
    name: string;
    email: string;
    avatarInitials: string;
    role: SiteRole;
  }>;
  taxonomies: TaxonomyRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const canManageSite = hasPermission(userRole, "site:manage");
  const canManageTax = hasPermission(userRole, "taxonomy:manage");

  const [name, setName] = useState(site.name);
  const [tagline, setTagline] = useState(site.tagline);
  const [domain, setDomain] = useState(site.domain ?? "");
  const [description, setDescription] = useState(site.description);
  const [theme, setTheme] = useState<ThemeSettings>(site.themeSettings);
  const [metaTitle, setMetaTitle] = useState(site.seoDefaults.metaTitle ?? site.name);
  const [metaDescription, setMetaDescription] = useState(
    site.seoDefaults.metaDescription ?? site.description
  );
  const [canonicalUrl, setCanonicalUrl] = useState(site.seoDefaults.canonicalUrl ?? "");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [taxError, setTaxError] = useState<string | null>(null);

  function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageSite) return;
    setFeedback(null);
    startTransition(async () => {
      const res = await saveSiteSettingsAction({
        name,
        tagline,
        description,
        domain,
        themeSettings: theme,
        seoDefaults: {
          metaTitle,
          metaDescription,
          canonicalUrl
        }
      });

      if (!res.ok) {
        setFeedback({ type: "error", message: res.error ?? "Failed to update site settings." });
        return;
      }

      setFeedback({ type: "success", message: "Site identity, design tokens, and SEO defaults saved." });
      router.refresh();
    });
  }

  async function handleAddTaxonomy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTaxError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const res = await createTaxonomyAction(formData);
    if (!res.ok) {
      setTaxError(res.error ?? "Could not add taxonomy.");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {!canManageSite ? (
        <div className="rounded-xl border border-[#E6C9A2] bg-[#F8EBD9] px-4 py-3 text-xs text-[#6E4514]">
          <strong>Read-only Site Configuration ({userRole}):</strong> Only <strong>Owners</strong> and <strong>Administrators</strong> can save changes to site identity and theme tokens.
        </div>
      ) : null}

      {feedback ? (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "border-brand/30 bg-brand-soft text-brand"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          <CheckCircle2 size={17} aria-hidden="true" />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <form onSubmit={handleSaveSettings} className="grid gap-6 lg:grid-cols-2">
        {/* Site Identity & Default SEO */}
        <section className="space-y-4 rounded-2xl border border-line bg-white p-6">
          <h2 className="text-base font-semibold">Site Identity & Default SEO</h2>

          <div>
            <label htmlFor="site-name" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Site Name
            </label>
            <input
              id="site-name"
              type="text"
              required
              disabled={!canManageSite}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Public Site Slug
              </label>
              <input
                type="text"
                disabled
                value={`/s/${site.slug}`}
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 font-mono text-sm text-muted"
              />
            </div>
            <div>
              <label htmlFor="site-domain" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Custom Domain
              </label>
              <input
                id="site-domain"
                type="text"
                disabled={!canManageSite}
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="site-tagline" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Tagline
            </label>
            <input
              id="site-tagline"
              type="text"
              disabled={!canManageSite}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="site-desc" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Site Description
            </label>
            <textarea
              id="site-desc"
              rows={2}
              disabled={!canManageSite}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm"
            />
          </div>

          <div className="border-t border-line pt-4">
            <label htmlFor="site-seo-title" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Default Meta Title
            </label>
            <input
              id="site-seo-title"
              type="text"
              disabled={!canManageSite}
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="site-seo-desc" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Default Meta Description
            </label>
            <input
              id="site-seo-desc"
              type="text"
              disabled={!canManageSite}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="site-canon" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Base Canonical URL
            </label>
            <input
              id="site-canon"
              type="url"
              disabled={!canManageSite}
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 font-mono text-sm"
            />
          </div>
        </section>

        {/* Design System & Theme Tokens */}
        <section className="flex flex-col justify-between rounded-2xl border border-line bg-white p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-brand" aria-hidden="true" />
              <h2 className="text-base font-semibold">Design Tokens & Theme System</h2>
            </div>
            <p className="text-xs text-muted">
              Shared design tokens applied across public site headers, buttons, and block rendering.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="tok-primary" className="block text-xs font-semibold text-muted">
                  Primary Brand
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="tok-primary"
                    type="color"
                    disabled={!canManageSite}
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="h-9 w-11 cursor-pointer rounded border border-line"
                  />
                  <span className="font-mono text-xs">{theme.primaryColor}</span>
                </div>
              </div>

              <div>
                <label htmlFor="tok-accent" className="block text-xs font-semibold text-muted">
                  Accent Color
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="tok-accent"
                    type="color"
                    disabled={!canManageSite}
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className="h-9 w-11 cursor-pointer rounded border border-line"
                  />
                  <span className="font-mono text-xs">{theme.accentColor}</span>
                </div>
              </div>

              <div>
                <label htmlFor="tok-bg" className="block text-xs font-semibold text-muted">
                  Canvas Surface
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    id="tok-bg"
                    type="color"
                    disabled={!canManageSite}
                    value={theme.backgroundColor}
                    onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                    className="h-9 w-11 cursor-pointer rounded border border-line"
                  />
                  <span className="font-mono text-xs">{theme.backgroundColor}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="tok-hfont" className="block text-xs font-semibold text-muted">
                  Heading Typography
                </label>
                <select
                  id="tok-hfont"
                  disabled={!canManageSite}
                  value={theme.headingFont}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      headingFont: e.target.value as ThemeSettings["headingFont"]
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
                >
                  <option value="system">System Sans-Serif</option>
                  <option value="serif">Editorial Serif</option>
                  <option value="mono">Technical Monospace</option>
                </select>
              </div>

              <div>
                <label htmlFor="tok-radius" className="block text-xs font-semibold text-muted">
                  Component Radius
                </label>
                <select
                  id="tok-radius"
                  disabled={!canManageSite}
                  value={theme.borderRadius}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      borderRadius: e.target.value as ThemeSettings["borderRadius"]
                    })
                  }
                  className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
                >
                  <option value="rounded">Rounded (Modern Default)</option>
                  <option value="pill">Pill (Soft Studio)</option>
                  <option value="sharp">Sharp (Editorial Brutalist)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-4">
            <button
              type="submit"
              disabled={!canManageSite || isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} aria-hidden="true" />
              {isPending ? "Saving Settings..." : "Save Site & Theme Settings"}
            </button>
          </div>
        </section>
      </form>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Site Members & Access Control */}
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-brand" aria-hidden="true" />
            <h2 className="text-base font-semibold">Site Memberships & Roles</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Users with explicit membership access to {site.name}.
          </p>

          <div className="mt-4 divide-y divide-line">
            {members.map((m) => (
              <div
                key={m.membershipId}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#E8D9C9] text-xs font-semibold text-ink">
                    {m.avatarInitials}
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{m.name}</p>
                    <p className="font-mono text-xs text-muted">{m.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold capitalize text-brand">
                    {ROLE_DESCRIPTIONS[m.role]?.label ?? m.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Taxonomies (Categories & Tags) */}
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-brand" aria-hidden="true" />
            <h2 className="text-base font-semibold">Categories & Tags</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Structured taxonomy terms scoped to {site.name}.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {taxonomies.map((tax) => (
              <span
                key={tax.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1 text-xs font-medium text-ink"
              >
                <span>{tax.name}</span>
                <span className="text-[10px] uppercase text-muted">({tax.type})</span>
              </span>
            ))}
          </div>

          {canManageTax ? (
            <form onSubmit={handleAddTaxonomy} className="mt-5 border-t border-line pt-4">
              {taxError ? (
                <p className="mb-2 text-xs text-red-600">{taxError}</p>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="New category or tag name..."
                  className="flex-1 rounded-xl border border-line bg-canvas px-3 py-2 text-xs"
                />
                <select
                  name="type"
                  className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs"
                >
                  <option value="category">Category</option>
                  <option value="tag">Tag</option>
                </select>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-brand"
                >
                  <Plus size={14} aria-hidden="true" />
                  Add Term
                </button>
              </div>
            </form>
          ) : null}
        </section>
      </div>
    </div>
  );
}
