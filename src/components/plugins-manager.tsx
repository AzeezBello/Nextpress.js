"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  PackagePlus,
  Plug,
  Settings,
  Terminal,
  Trash2
} from "lucide-react";
import {
  OFFICIAL_NODE_PLUGIN_PACKAGES,
  type PluginHookName,
  type SitePluginRecord
} from "@/lib/plugins";
import {
  installPluginAction,
  togglePluginAction,
  uninstallPluginAction,
  updatePluginConfigAction
} from "@/lib/actions";

const AVAILABLE_HOOKS: { id: PluginHookName; label: string }[] = [
  { id: "site:headerBanner", label: "site:headerBanner (Public Top Banner)" },
  { id: "content:readingTime", label: "content:readingTime (Article Reading Time)" },
  { id: "block:codeEnhance", label: "block:codeEnhance (Code Block Chrome)" },
  { id: "site:footerBadge", label: "site:footerBadge (Public Footer Telemetry)" },
  { id: "seo:extendSchema", label: "seo:extendSchema (Schema.org @graph Hook)" },
  { id: "block:register", label: "block:register (Custom Block Extension)" }
];

export function PluginsManager({
  plugins,
  workspaceDependencies,
  canManageSite,
  siteSlug
}: {
  plugins: SitePluginRecord[];
  workspaceDependencies: Record<string, string>;
  canManageSite: boolean;
  siteSlug: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [editingPluginId, setEditingPluginId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<Record<string, string | boolean | number>>({});

  // Add Node Package form state
  const [packageName, setPackageName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [selectedHooks, setSelectedHooks] = useState<PluginHookName[]>(["seo:extendSchema"]);

  const filteredPlugins = plugins.filter((p) => {
    if (filter === "active") return p.enabled;
    if (filter === "inactive") return !p.enabled;
    return true;
  });

  function handleToggle(plugin: SitePluginRecord) {
    setFeedback(null);
    startTransition(async () => {
      const res = await togglePluginAction({
        pluginId: plugin.id,
        enabled: !plugin.enabled
      });
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Could not update plugin status." });
      } else {
        setFeedback({
          type: "ok",
          message: `${plugin.packageName} ${!plugin.enabled ? "activated" : "deactivated"} on /s/${siteSlug}.`
        });
      }
    });
  }

  function handleInstallPackage(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    startTransition(async () => {
      const res = await installPluginAction({
        packageName,
        displayName: displayName || undefined,
        version: version || "1.0.0",
        description: description || undefined,
        hooks: selectedHooks
      });
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Failed to install Node plugin." });
      } else {
        setFeedback({
          type: "ok",
          message: `Registered Node package "${packageName.trim()}" and activated it for this site.`
        });
        setPackageName("");
        setDisplayName("");
        setDescription("");
      }
    });
  }

  function handleSaveConfig(pluginId: string, pkgName: string) {
    setFeedback(null);
    startTransition(async () => {
      const res = await updatePluginConfigAction({
        pluginId,
        config: configDraft
      });
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Failed to save plugin configuration." });
      } else {
        setFeedback({
          type: "ok",
          message: `Saved configuration for ${pkgName}.`
        });
        setEditingPluginId(null);
      }
    });
  }

  function handleUninstall(plugin: SitePluginRecord) {
    setFeedback(null);
    startTransition(async () => {
      const res = await uninstallPluginAction(plugin.id);
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Could not remove plugin." });
      } else {
        setFeedback({
          type: "ok",
          message: `Removed Node package ${plugin.packageName} from site.`
        });
      }
    });
  }

  const activeCount = plugins.filter((p) => p.enabled).length;

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

      {/* Top Architecture Banner */}
      <section className="rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Node Package Extension Runtime
            </p>
            <h2 className="mt-1 text-lg font-semibold text-ink">
              Installed Site Plugins ({activeCount} Active / {plugins.length} Total)
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              Unlike legacy CMS plugins that execute arbitrary uploaded archives, NextPress.js
              plugins are declarative Node packages (<code className="text-ink">@nextpress/plugin-*</code>)
              with scoped lifecycle hooks and per-site configuration.
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-line bg-canvas p-1">
            {(["all", "active", "inactive"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                  filter === tab ? "bg-brand text-white" : "text-muted hover:text-ink"
                }`}
              >
                {tab} (
                {tab === "all"
                  ? plugins.length
                  : tab === "active"
                    ? activeCount
                    : plugins.length - activeCount}
                )
              </button>
            ))}
          </div>
        </div>

        {/* Plugins Table / Cards */}
        <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
          {filteredPlugins.map((plugin) => {
            const isEditing = editingPluginId === plugin.id;
            return (
              <div
                key={plugin.id}
                className={`p-5 transition ${
                  plugin.enabled ? "bg-brand-soft/15" : "bg-white"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-base font-semibold text-ink">
                        <Plug size={15} className={plugin.enabled ? "text-brand" : "text-muted"} />
                        {plugin.displayName}
                      </span>
                      <code className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-xs text-ink">
                        {plugin.packageName}@{plugin.version}
                      </code>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          plugin.enabled
                            ? "bg-[#DCF4E7] text-success"
                            : "bg-canvas text-muted"
                        }`}
                      >
                        {plugin.enabled ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <p className="max-w-2xl text-xs leading-5 text-muted">
                      {plugin.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted">
                      <span>By {plugin.author}</span>
                      <span>•</span>
                      <span>Hooks:</span>
                      {plugin.hooks.map((h) => (
                        <code
                          key={h}
                          className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-brand"
                        >
                          {h}
                        </code>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canManageSite || isPending}
                      onClick={() => handleToggle(plugin)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                        plugin.enabled
                          ? "border border-line bg-white text-ink hover:border-danger hover:text-danger"
                          : "bg-brand text-white hover:bg-ink"
                      }`}
                    >
                      {plugin.enabled ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          setEditingPluginId(null);
                        } else {
                          setEditingPluginId(plugin.id);
                          setConfigDraft({ ...plugin.config });
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                    >
                      <Settings size={13} />
                      Settings
                    </button>

                    {canManageSite ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleUninstall(plugin)}
                        title="Remove package from site"
                        className="rounded-full border border-line bg-white p-1.5 text-muted hover:border-danger hover:text-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Inline Configuration Drawer */}
                {isEditing ? (
                  <div className="mt-4 rounded-2xl border border-line bg-canvas p-4">
                    <p className="text-xs font-semibold text-ink">
                      Package Configuration (<code>{plugin.packageName}</code>)
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {Object.entries(configDraft).map(([key, val]) => (
                        <label key={key} className="block">
                          <span className="font-mono text-xs font-semibold text-ink">{key}</span>
                          {typeof val === "boolean" ? (
                            <select
                              disabled={!canManageSite}
                              value={val ? "true" : "false"}
                              onChange={(e) =>
                                setConfigDraft({
                                  ...configDraft,
                                  [key]: e.target.value === "true"
                                })
                              }
                              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink"
                            >
                              <option value="true">true (Enabled)</option>
                              <option value="false">false (Disabled)</option>
                            </select>
                          ) : (
                            <input
                              type={typeof val === "number" ? "number" : "text"}
                              disabled={!canManageSite}
                              value={String(val)}
                              onChange={(e) =>
                                setConfigDraft({
                                  ...configDraft,
                                  [key]:
                                    typeof val === "number"
                                      ? Number(e.target.value)
                                      : e.target.value
                                })
                              }
                              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPluginId(null)}
                        className="rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-muted"
                      >
                        Cancel
                      </button>
                      {canManageSite ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSaveConfig(plugin.id, plugin.packageName)}
                          className="rounded-full bg-brand px-4 py-1.5 text-xs font-semibold text-white hover:bg-ink"
                        >
                          Save Options
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Node Package Plugin + Workspace package.json Inspector */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-line bg-white p-6">
          <div className="flex items-center gap-2">
            <PackagePlus size={18} className="text-brand" />
            <h2 className="text-lg font-semibold text-ink">
              Add Node Package Plugin
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted">
            Register any npm package (<code className="text-ink">@scope/pkg</code> or{" "}
            <code className="text-ink">nextpress-plugin-*</code>) into the site plugin registry.
          </p>

          {/* Quick-Install Official Packages if any were removed */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted">Quick-fill preset:</span>
            {OFFICIAL_NODE_PLUGIN_PACKAGES.map((pkg) => (
              <button
                key={pkg.packageName}
                type="button"
                onClick={() => {
                  setPackageName(pkg.packageName);
                  setDisplayName(pkg.displayName);
                  setVersion(pkg.version);
                  setDescription(pkg.description);
                  setSelectedHooks(pkg.hooks);
                }}
                className="rounded-lg border border-line bg-canvas px-2.5 py-1 font-mono text-[11px] text-ink hover:border-brand hover:text-brand"
              >
                {pkg.packageName}
              </button>
            ))}
          </div>

          <form onSubmit={handleInstallPackage} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-ink">npm Package Name *</span>
                <input
                  type="text"
                  required
                  disabled={!canManageSite}
                  placeholder="@nextpress/plugin-newsletter"
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">SemVer Version</span>
                <input
                  type="text"
                  disabled={!canManageSite}
                  placeholder="1.0.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-semibold text-ink">Display Name</span>
                <input
                  type="text"
                  disabled={!canManageSite}
                  placeholder="NextPress Newsletter Capture"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-ink">Primary Hook Capability</span>
                <select
                  disabled={!canManageSite}
                  value={selectedHooks[0] || "seo:extendSchema"}
                  onChange={(e) => setSelectedHooks([e.target.value as PluginHookName])}
                  className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
                >
                  {AVAILABLE_HOOKS.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-semibold text-ink">Package Description</span>
              <input
                type="text"
                disabled={!canManageSite}
                placeholder="Describes how this Node package extends NextPress.js..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs text-ink"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-[#111715] px-4 py-3 font-mono text-xs text-[#E6ECE9]">
              <span className="flex items-center gap-2">
                <Terminal size={14} className="text-brand" />
                <code>npm install {packageName.trim() || "@nextpress/plugin-example"}</code>
              </span>
              {canManageSite ? (
                <button
                  type="submit"
                  disabled={isPending || !packageName.trim()}
                  className="rounded-full bg-brand px-4 py-1.5 font-sans text-xs font-semibold text-white transition hover:bg-white hover:text-ink disabled:opacity-50"
                >
                  {isPending ? "Installing..." : "Install & Activate Package"}
                </button>
              ) : null}
            </div>
          </form>
        </section>

        {/* Workspace package.json Node Dependencies */}
        <section className="rounded-3xl border border-line bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
            Workspace Runtime
          </p>
          <h2 className="mt-1 text-lg font-semibold text-ink">
            <code>package.json</code> Node Packages
          </h2>
          <p className="mt-1 text-xs text-muted">
            Verified Node packages currently installed in this NextPress.js runtime environment.
          </p>

          <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-canvas px-4 py-2">
            {Object.entries(workspaceDependencies).map(([dep, ver]) => (
              <div key={dep} className="flex items-center justify-between py-2.5 text-xs">
                <code className="font-mono font-semibold text-ink">{dep}</code>
                <span className="rounded-md bg-white px-2 py-0.5 font-mono text-[11px] text-muted">
                  {ver}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
