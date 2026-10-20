"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ExternalLink, Palette, Sparkles } from "lucide-react";
import type { SiteRecord, ThemeSettings } from "@/lib/content-types";
import { saveAppearanceThemeAction } from "@/lib/actions";

type ThemePreset = {
  id: string;
  name: string;
  tagline: string;
  settings: ThemeSettings;
};

const THEME_PRESETS: ThemePreset[] = [
  {
    id: "editorial-forest",
    name: "Editorial Forest (Default)",
    tagline: "Calm forest green and warm bronze crafted for long-form publications.",
    settings: {
      primaryColor: "#176B4D",
      accentColor: "#8A5A20",
      backgroundColor: "#F6F7F4",
      headingFont: "system",
      bodyFont: "system",
      borderRadius: "rounded"
    }
  },
  {
    id: "northwind-studio",
    name: "Northwind Agency",
    tagline: "Deep navy, teal accents, and editorial serif headings for client studios.",
    settings: {
      primaryColor: "#1E3A8A",
      accentColor: "#0D9488",
      backgroundColor: "#F8FAFC",
      headingFont: "serif",
      bodyFont: "system",
      borderRadius: "pill"
    }
  },
  {
    id: "warm-gazette",
    name: "Warm Paper Gazette",
    tagline: "Classic print-inspired literary serif palette on warm archival paper.",
    settings: {
      primaryColor: "#7C2D12",
      accentColor: "#B45309",
      backgroundColor: "#FAF7F2",
      headingFont: "serif",
      bodyFont: "serif",
      borderRadius: "sharp"
    }
  },
  {
    id: "swiss-mono",
    name: "Swiss Engineering Mono",
    tagline: "High-contrast technical documentation theme with monospace display headings.",
    settings: {
      primaryColor: "#111827",
      accentColor: "#DC2626",
      backgroundColor: "#F3F4F6",
      headingFont: "mono",
      bodyFont: "system",
      borderRadius: "sharp"
    }
  },
  {
    id: "emerald-saas",
    name: "Emerald Product Launch",
    tagline: "Crisp emerald and indigo accents with pill-shaped call-to-action buttons.",
    settings: {
      primaryColor: "#047857",
      accentColor: "#4F46E5",
      backgroundColor: "#F0FDF4",
      headingFont: "system",
      bodyFont: "system",
      borderRadius: "pill"
    }
  }
];

export function AppearanceStudio({
  site,
  canManageSite
}: {
  site: SiteRecord;
  canManageSite: boolean;
}) {
  const [theme, setTheme] = useState<ThemeSettings>({
    primaryColor: site.themeSettings.primaryColor || "#176B4D",
    accentColor: site.themeSettings.accentColor || "#8A5A20",
    backgroundColor: site.themeSettings.backgroundColor || "#F6F7F4",
    headingFont: site.themeSettings.headingFont || "system",
    bodyFont: site.themeSettings.bodyFont || "system",
    borderRadius: site.themeSettings.borderRadius || "rounded"
  });

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  function handleSave(nextTheme: ThemeSettings = theme) {
    setFeedback(null);
    startTransition(async () => {
      const res = await saveAppearanceThemeAction(nextTheme);
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Failed to save theme settings." });
      } else {
        setFeedback({
          type: "ok",
          message: `Theme tokens applied to ${site.name} (/s/${site.slug}).`
        });
      }
    });
  }

  const radiusPreviewClass =
    theme.borderRadius === "sharp"
      ? "rounded-none"
      : theme.borderRadius === "pill"
        ? "rounded-full"
        : "rounded-xl";

  const headingFontClass =
    theme.headingFont === "serif"
      ? "font-serif"
      : theme.headingFont === "mono"
        ? "font-mono"
        : "font-sans";

  const bodyFontClass = theme.bodyFont === "serif" ? "font-serif" : "font-sans";

  return (
    <div className="space-y-6">
      {feedback ? (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${
            feedback.type === "err"
              ? "border-[#E9B8B8] bg-[#FBE9E9] text-danger"
              : "border-brand/30 bg-brand-soft text-brand"
          }`}
        >
          <CheckCircle2 size={15} />
          {feedback.message}
        </div>
      ) : null}

      {/* WordPress-style Themes Grid */}
      <section className="rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Theme Directory
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Curated NextPress Themes
            </h2>
            <p className="mt-1 text-xs text-muted">
              Select a starter theme preset or customize individual design tokens below.
            </p>
          </div>
          <a
            href={`/s/${site.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-4 py-2 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
          >
            Preview Live Site
            <ExternalLink size={13} />
          </a>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {THEME_PRESETS.map((preset) => {
            const isActive =
              theme.primaryColor.toLowerCase() === preset.settings.primaryColor.toLowerCase() &&
              theme.backgroundColor.toLowerCase() ===
                preset.settings.backgroundColor.toLowerCase() &&
              theme.headingFont === preset.settings.headingFont &&
              theme.borderRadius === preset.settings.borderRadius;

            return (
              <div
                key={preset.id}
                className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                  isActive
                    ? "border-brand bg-brand-soft/25 ring-2 ring-brand/20"
                    : "border-line bg-canvas hover:border-brand/50"
                }`}
              >
                <div>
                  {/* Mini visual swatch */}
                  <div
                    className="rounded-xl border border-black/10 p-4"
                    style={{ backgroundColor: preset.settings.backgroundColor }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-5 w-5 rounded-full border border-black/10"
                        style={{ backgroundColor: preset.settings.primaryColor }}
                      />
                      <span
                        className="h-5 w-5 rounded-full border border-black/10"
                        style={{ backgroundColor: preset.settings.accentColor }}
                      />
                      <span className="ml-auto rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink">
                        {preset.settings.headingFont} · {preset.settings.borderRadius}
                      </span>
                    </div>
                    <p
                      className="mt-3 text-sm font-semibold"
                      style={{ color: preset.settings.primaryColor }}
                    >
                      {site.name}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-ink">{preset.name}</h3>
                    {isActive ? (
                      <span className="rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        Active
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{preset.tagline}</p>
                </div>

                <div className="mt-4 pt-2">
                  <button
                    type="button"
                    disabled={!canManageSite || isPending}
                    onClick={() => {
                      setTheme(preset.settings);
                      handleSave(preset.settings);
                    }}
                    className="w-full rounded-xl border border-line bg-white px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-50"
                  >
                    {isActive ? "Re-apply Preset" : "Activate Theme Preset"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Token Customizer + Live Preview */}
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="rounded-3xl border border-line bg-white p-6">
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-brand" />
            <h2 className="text-lg font-semibold text-ink">Theme Token Customizer</h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Fine-tune CSS custom properties and typography tokens injected into{" "}
            <code>/s/{site.slug}</code>.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold text-ink">Primary Brand Color</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
                <input
                  type="color"
                  disabled={!canManageSite}
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="h-7 w-8 cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  disabled={!canManageSite}
                  value={theme.primaryColor}
                  onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                  className="w-full bg-transparent font-mono text-xs text-ink outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Accent Highlight Color</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
                <input
                  type="color"
                  disabled={!canManageSite}
                  value={theme.accentColor}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="h-7 w-8 cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  disabled={!canManageSite}
                  value={theme.accentColor}
                  onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                  className="w-full bg-transparent font-mono text-xs text-ink outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Canvas Background</span>
              <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-canvas px-3 py-2">
                <input
                  type="color"
                  disabled={!canManageSite}
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  className="h-7 w-8 cursor-pointer border-0 bg-transparent"
                />
                <input
                  type="text"
                  disabled={!canManageSite}
                  value={theme.backgroundColor}
                  onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                  className="w-full bg-transparent font-mono text-xs text-ink outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Heading Font Stack</span>
              <select
                disabled={!canManageSite}
                value={theme.headingFont}
                onChange={(e) =>
                  setTheme({
                    ...theme,
                    headingFont: e.target.value as ThemeSettings["headingFont"]
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink"
              >
                <option value="system">System Sans (Modern UI)</option>
                <option value="serif">Editorial Serif (Literary)</option>
                <option value="mono">Technical Mono (Engineering)</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Body Copy Font</span>
              <select
                disabled={!canManageSite}
                value={theme.bodyFont}
                onChange={(e) =>
                  setTheme({
                    ...theme,
                    bodyFont: e.target.value as ThemeSettings["bodyFont"]
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink"
              >
                <option value="system">System Sans</option>
                <option value="serif">Editorial Serif</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Button & Surface Radius</span>
              <select
                disabled={!canManageSite}
                value={theme.borderRadius}
                onChange={(e) =>
                  setTheme({
                    ...theme,
                    borderRadius: e.target.value as ThemeSettings["borderRadius"]
                  })
                }
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink"
              >
                <option value="sharp">Sharp (0px)</option>
                <option value="rounded">Rounded (12px)</option>
                <option value="pill">Pill (999px)</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <p className="text-xs text-muted">
              {canManageSite
                ? "Changes take effect immediately across all public pages and blog posts."
                : "Read-only: only Site Owners and Administrators can save appearance changes."}
            </p>
            {canManageSite ? (
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSave(theme)}
                className="rounded-full bg-brand px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-ink disabled:opacity-50"
              >
                {isPending ? "Saving Appearance..." : "Save & Publish Theme"}
              </button>
            ) : null}
          </div>
        </section>

        {/* Live Interactive Preview */}
        <section className="rounded-3xl border border-line bg-white p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-brand" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
              Live Specimen Preview
            </h2>
          </div>

          <div
            className={`mt-4 rounded-2xl border border-line p-6 transition ${bodyFontClass}`}
            style={{ backgroundColor: theme.backgroundColor }}
          >
            <span
              className={`inline-block px-3 py-1 text-[11px] font-semibold text-white ${radiusPreviewClass}`}
              style={{ backgroundColor: theme.accentColor }}
            >
              Featured Editorial
            </span>

            <h3
              className={`mt-3 text-2xl font-semibold tracking-tight text-ink ${headingFontClass}`}
            >
              {site.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-muted">
              {site.tagline ||
                "Structured blocks and design tokens working in harmony across every breakpoint."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <span
                className={`inline-flex items-center px-4 py-2 text-xs font-semibold text-white ${radiusPreviewClass}`}
                style={{ backgroundColor: theme.primaryColor }}
              >
                Primary Action
              </span>
              <span
                className={`inline-flex items-center border bg-white px-4 py-2 text-xs font-semibold ${radiusPreviewClass}`}
                style={{
                  borderColor: theme.primaryColor,
                  color: theme.primaryColor
                }}
              >
                Secondary Outline
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
