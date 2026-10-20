"use client";

import { useId, useState, useTransition } from "react";
import {
  CheckCircle2,
  Download,
  Filter,
  FolderKanban,
  PackagePlus,
  Plug,
  Search,
  Settings,
  Sparkles,
  Star,
  Terminal,
  Trash2,
  X
} from "lucide-react";
import {
  NODE_PLUGIN_DIRECTORY,
  PLUGIN_CATEGORIES,
  resolvePluginCategory,
  searchNodePluginDirectory,
  type NodePluginManifest,
  type PluginBrowseTab,
  type PluginCategoryFilter,
  type PluginHookName,
  type PluginSearchField,
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

function formatInstalls(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k+ active installations`;
  }
  return `${count}+ active installations`;
}

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
  const baseId = useId();
  const directorySearchInputId = `${baseId}-directory-search`;
  const directorySearchById = `${baseId}-directory-search-by`;
  const installedSearchInputId = `${baseId}-installed-search`;
  const installedCategorySelectId = `${baseId}-installed-category`;

  const [isPending, startTransition] = useTransition();
  const [installingPkg, setInstallingPkg] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; message: string } | null>(null);

  // Top-level view mode: WordPress-style "Add New Plugin" directory vs "Installed Plugins"
  const [activeView, setActiveView] = useState<"add-new" | "installed">("add-new");
  const [showCustomForm, setShowCustomForm] = useState(false);

  // "Add New Plugin" Dynamic Search & Category Filter state (like WordPress plugin-install.php)
  const [searchQuery, setSearchQuery] = useState("");
  const [searchBy, setSearchBy] = useState<PluginSearchField>("all");
  const [selectedCategory, setSelectedCategory] = useState<PluginCategoryFilter>("all");
  const [browseTab, setBrowseTab] = useState<PluginBrowseTab>("all");

  // "Installed Plugins" filter state
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [installedCategoryFilter, setInstalledCategoryFilter] =
    useState<PluginCategoryFilter>("all");
  const [installedSearchQuery, setInstalledSearchQuery] = useState("");
  const [editingPluginId, setEditingPluginId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<Record<string, string | boolean | number>>({});

  // Custom Node Package drawer state
  const [packageName, setPackageName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [selectedHooks, setSelectedHooks] = useState<PluginHookName[]>(["seo:extendSchema"]);

  // Map installed plugins by lowercase package name for instant status lookup on Directory cards
  const installedByPackage = new Map<string, SitePluginRecord>();
  for (const p of plugins) {
    installedByPackage.set(p.packageName.toLowerCase(), p);
  }

  // Dynamic search results for "Add New Plugin"
  const directoryResults = searchNodePluginDirectory({
    query: searchQuery,
    category: selectedCategory,
    browseTab,
    searchBy
  });

  // Filtered "Installed Plugins" list (searchable by name or category)
  const filteredInstalledPlugins = plugins.filter((p) => {
    if (statusFilter === "active" && !p.enabled) return false;
    if (statusFilter === "inactive" && p.enabled) return false;

    const cat = resolvePluginCategory(p.packageName, p.hooks);
    if (installedCategoryFilter !== "all" && cat.slug !== installedCategoryFilter) {
      return false;
    }

    const q = installedSearchQuery.trim().toLowerCase();
    if (!q) return true;

    return (
      p.displayName.toLowerCase().includes(q) ||
      p.packageName.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      cat.slug.toLowerCase().includes(q) ||
      cat.label.toLowerCase().includes(q)
    );
  });

  function handleToggle(plugin: SitePluginRecord) {
    setFeedback(null);
    setInstallingPkg(plugin.packageName);
    startTransition(async () => {
      const res = await togglePluginAction({
        pluginId: plugin.id,
        enabled: !plugin.enabled
      });
      setInstallingPkg(null);
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

  function handleQuickInstallManifest(manifest: NodePluginManifest) {
    setFeedback(null);
    setInstallingPkg(manifest.packageName);
    startTransition(async () => {
      const res = await installPluginAction({
        packageName: manifest.packageName,
        displayName: manifest.displayName,
        version: manifest.version,
        description: manifest.description,
        hooks: manifest.hooks
      });
      setInstallingPkg(null);
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Failed to install Node plugin." });
      } else {
        setFeedback({
          type: "ok",
          message: `Installed and activated ${manifest.displayName} (${manifest.packageName}@${manifest.version}).`
        });
      }
    });
  }

  function handleInstallCustomPackage(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const trimmed = packageName.trim();
    setInstallingPkg(trimmed);
    startTransition(async () => {
      const res = await installPluginAction({
        packageName: trimmed,
        displayName: displayName || undefined,
        version: version || "1.0.0",
        description: description || undefined,
        hooks: selectedHooks
      });
      setInstallingPkg(null);
      if (!res.ok) {
        setFeedback({ type: "err", message: res.error || "Failed to install Node plugin." });
      } else {
        setFeedback({
          type: "ok",
          message: `Registered Node package "${trimmed}" and activated it for this site.`
        });
        setPackageName("");
        setDisplayName("");
        setDescription("");
        setShowCustomForm(false);
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
    setInstallingPkg(plugin.packageName);
    startTransition(async () => {
      const res = await uninstallPluginAction(plugin.id);
      setInstallingPkg(null);
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
      {/* Live Status / Feedback Banner */}
      <div aria-live="polite">
        {feedback ? (
          <div
            className={`flex items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold ${
              feedback.type === "err"
                ? "border-[#E9B8B8] bg-[#FBE9E9] text-danger"
                : "border-brand/30 bg-brand-soft text-brand"
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 size={15} />
              {feedback.message}
            </span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="rounded-full p-1 hover:bg-black/5"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ) : null}
      </div>

      {/* WordPress-Style Top Navigation Bar: Add New Plugin vs Installed Plugins */}
      <section className="rounded-3xl border border-line bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView("add-new")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeView === "add-new"
                  ? "bg-brand text-white shadow-xs"
                  : "border border-line bg-canvas text-ink hover:border-brand hover:text-brand"
              }`}
            >
              <Sparkles size={14} />
              Add New Plugin (Directory Search)
            </button>

            <button
              type="button"
              onClick={() => setActiveView("installed")}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
                activeView === "installed"
                  ? "bg-brand text-white shadow-xs"
                  : "border border-line bg-canvas text-ink hover:border-brand hover:text-brand"
              }`}
            >
              <Plug size={14} />
              Installed Plugins ({activeCount} Active / {plugins.length} Installed)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomForm((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
            aria-expanded={showCustomForm}
          >
            <PackagePlus size={14} />
            {showCustomForm ? "Close Custom Package Form" : "Register Custom npm Package"}
          </button>
        </div>

        {/* Collapsible Custom npm Package Drawer (like WordPress "Upload Plugin") */}
        {showCustomForm ? (
          <div className="mt-5 rounded-2xl border border-line bg-canvas p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-ink">
                  Register Custom Node.js / npm Package
                </h3>
                <p className="mt-0.5 text-xs text-muted">
                  Install any scoped (<code className="text-ink">@scope/pkg</code>) or standard (
                  <code className="text-ink">nextpress-plugin-*</code>) Node package with custom hook bindings.
                </p>
              </div>
            </div>

            <form onSubmit={handleInstallCustomPackage} className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block sm:col-span-2">
                  <span className="text-xs font-semibold text-ink">npm Package Name *</span>
                  <input
                    type="text"
                    name="packageName"
                    required
                    disabled={!canManageSite}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="@acme/nextpress-plugin-crm"
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-mono text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">SemVer Version</span>
                  <input
                    type="text"
                    name="version"
                    disabled={!canManageSite}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    placeholder="1.0.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 font-mono text-xs text-ink"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-ink">Display Name</span>
                  <input
                    type="text"
                    name="displayName"
                    disabled={!canManageSite}
                    placeholder="Acme CRM Sync"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-ink">Primary Hook Capability</span>
                  <select
                    name="hook"
                    disabled={!canManageSite}
                    value={selectedHooks[0] || "seo:extendSchema"}
                    onChange={(e) => setSelectedHooks([e.target.value as PluginHookName])}
                    className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink"
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
                  name="description"
                  disabled={!canManageSite}
                  placeholder="Describes how this Node package extends NextPress.js..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink"
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
          </div>
        ) : null}
      </section>

      {/* ===================================================================== */}
      {/* VIEW 1: WORDPRESS-STYLE "ADD NEW PLUGIN" DYNAMIC SEARCH DIRECTORY      */}
      {/* ===================================================================== */}
      {activeView === "add-new" ? (
        <section className="space-y-5 rounded-3xl border border-line bg-white p-6">
          {/* WordPress Filter Bar: Browse Tabs + Search by Name or Category */}
          <div className="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                WordPress-Style Plugin Directory · Powered by npm Packages
              </p>
              <h2 className="text-lg font-semibold text-ink">Add Plugins</h2>
              <div
                role="tablist"
                aria-label="Browse plugin collections"
                className="flex flex-wrap items-center gap-1.5 pt-1"
              >
                {(
                  [
                    { id: "all", label: `All Plugins (${NODE_PLUGIN_DIRECTORY.length})` },
                    { id: "featured", label: "Featured" },
                    { id: "popular", label: "Popular" },
                    { id: "recommended", label: "Recommended" }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={browseTab === tab.id && !searchQuery}
                    onClick={() => {
                      setBrowseTab(tab.id);
                    }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      browseTab === tab.id
                        ? "bg-ink text-white"
                        : "bg-canvas text-muted hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Search Form (Search by Name, Category, Tag, or Author) */}
            <form
              role="search"
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-wrap items-end gap-2.5"
            >
              <div>
                <label
                  htmlFor={directorySearchById}
                  className="block text-[11px] font-semibold text-muted"
                >
                  Search by
                </label>
                <select
                  id={directorySearchById}
                  name="searchBy"
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value as PluginSearchField)}
                  className="mt-1 rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-semibold text-ink"
                >
                  <option value="all">Name or Category (All)</option>
                  <option value="name">Plugin / Package Name</option>
                  <option value="category">Category</option>
                  <option value="tag">Tag / Keyword</option>
                  <option value="author">Author</option>
                </select>
              </div>

              <div className="min-w-[260px] flex-1 sm:min-w-[320px]">
                <label
                  htmlFor={directorySearchInputId}
                  className="block text-[11px] font-semibold text-muted"
                >
                  Search Plugins (live filter by name, category, or npm package)
                </label>
                <div className="relative mt-1">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                  />
                  <input
                    id={directorySearchInputId}
                    name="q"
                    type="search"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    enterKeyHint="search"
                    placeholder={
                      searchBy === "category"
                        ? "e.g., SEO, Commerce, Security, Forms, Analytics..."
                        : searchBy === "name"
                          ? "e.g., Stripe, Table of Contents, @nextpress/plugin-..."
                          : "Search by plugin name, category (SEO, Forms...), or @scope/pkg"
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas py-2 pr-8 pl-9 text-xs text-ink placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search query"
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-muted hover:text-ink"
                    >
                      <X size={13} />
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          </div>

          {/* Category Filter Pills (Browse or combine with Search) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
                <FolderKanban size={14} className="text-brand" />
                Filter by Category:
              </span>
              {(selectedCategory !== "all" || searchQuery.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSearchQuery("");
                    setSearchBy("all");
                    setBrowseTab("all");
                  }}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Reset all filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === "all"
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-canvas text-ink hover:border-brand hover:text-brand"
                }`}
              >
                All Categories ({NODE_PLUGIN_DIRECTORY.length})
              </button>

              {PLUGIN_CATEGORIES.map((cat) => {
                const count = NODE_PLUGIN_DIRECTORY.filter(
                  (p) => p.category === cat.slug
                ).length;
                const active = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setSelectedCategory(active ? "all" : cat.slug)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-brand bg-brand text-white"
                        : "border-line bg-canvas text-ink hover:border-brand hover:text-brand"
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Summary Bar */}
          <div
            aria-live="polite"
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-canvas px-4 py-2.5 text-xs text-muted"
          >
            <span>
              Showing <strong className="text-ink">{directoryResults.length}</strong>{" "}
              {directoryResults.length === 1 ? "Node package plugin" : "Node package plugins"}
              {selectedCategory !== "all"
                ? ` in category "${
                    PLUGIN_CATEGORIES.find((c) => c.slug === selectedCategory)?.label ??
                    selectedCategory
                  }"`
                : ""}
              {searchQuery.trim() ? ` matching "${searchQuery.trim()}"` : ""}
            </span>
            <span className="font-mono text-[11px]">
              Site target: <strong className="text-ink">/s/{siteSlug}</strong>
            </span>
          </div>

          {/* WordPress-Style 2-Column Plugin Directory Grid */}
          {directoryResults.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line p-10 text-center">
              <p className="text-sm font-semibold text-ink">
                No plugins matched &ldquo;{searchQuery}&rdquo; in the selected filter.
              </p>
              <p className="mt-1 text-xs text-muted">
                Try switching the category filter to <strong>All Categories</strong>, searching by
                another keyword, or entering a valid npm package name (e.g.{" "}
                <code>@nextpress/plugin-custom</code>).
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {directoryResults.map((manifest) => {
                const installed = installedByPackage.get(
                  manifest.packageName.toLowerCase()
                );
                const isBusy =
                  isPending && installingPkg === manifest.packageName;

                return (
                  <article
                    key={manifest.packageName}
                    className="flex flex-col justify-between rounded-2xl border border-line bg-white p-5 shadow-2xs transition hover:border-brand/50"
                  >
                    <div>
                      {/* Card Header: Icon + Title + Category + Action Button */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-line bg-brand-soft text-brand">
                            <Plug size={20} />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-ink">
                                {manifest.displayName}
                              </h3>
                              <button
                                type="button"
                                onClick={() => setSelectedCategory(manifest.category)}
                                className="rounded-full border border-brand/25 bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand hover:bg-brand hover:text-white"
                                title={`Filter by ${manifest.categoryLabel}`}
                              >
                                {manifest.categoryLabel}
                              </button>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <code className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[11px] text-ink">
                                {manifest.packageName}@{manifest.version}
                              </code>
                              {installed ? (
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                    installed.enabled
                                      ? "bg-[#DCF4E7] text-success"
                                      : "bg-canvas text-muted"
                                  }`}
                                >
                                  {installed.enabled ? "Active on Site" : "Installed (Inactive)"}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {/* WordPress-Style Install Now / Activate / Active Button */}
                        <div className="shrink-0">
                          {!installed ? (
                            <button
                              type="button"
                              disabled={!canManageSite || isPending}
                              onClick={() => handleQuickInstallManifest(manifest)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-ink disabled:opacity-50"
                            >
                              <Download size={13} />
                              {isBusy ? "Installing..." : "Install Now"}
                            </button>
                          ) : !installed.enabled ? (
                            <button
                              type="button"
                              disabled={!canManageSite || isPending}
                              onClick={() => handleToggle(installed)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand disabled:opacity-50"
                            >
                              {isBusy ? "Activating..." : "Activate"}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveView("installed");
                                  setEditingPluginId(installed.id);
                                  setConfigDraft({ ...installed.config });
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
                              >
                                <Settings size={12} />
                                Configure
                              </button>
                              <button
                                type="button"
                                disabled={!canManageSite || isPending}
                                onClick={() => handleToggle(installed)}
                                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-muted hover:border-danger hover:text-danger disabled:opacity-50"
                              >
                                Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs leading-5 text-muted">
                        {manifest.description}
                      </p>

                      {/* Clickable Tags & Lifecycle Hooks */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {manifest.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setSearchBy("all");
                              setSearchQuery(tag);
                            }}
                            className="rounded-md bg-canvas px-2 py-0.5 text-[11px] text-muted transition hover:bg-brand-soft hover:text-brand"
                          >
                            #{tag}
                          </button>
                        ))}
                        {manifest.hooks.map((h) => (
                          <code
                            key={h}
                            className="rounded bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-brand"
                          >
                            {h}
                          </code>
                        ))}
                      </div>
                    </div>

                    {/* WordPress-Style Card Footer: Rating, Active Installs, Author, Compatibility */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-muted">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink">
                          <Star size={12} className="fill-[#E59819] text-[#E59819]" />
                          {manifest.rating.toFixed(1)}
                          <span className="font-normal text-muted">
                            ({manifest.ratingCount})
                          </span>
                        </span>
                        <span>•</span>
                        <span>{formatInstalls(manifest.activeInstalls)}</span>
                        <span>•</span>
                        <span>By {manifest.author}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-success font-semibold">
                          ✓ {manifest.testedUpTo}
                        </span>
                        <span>· {manifest.lastUpdated}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* ===================================================================== */}
      {/* VIEW 2: INSTALLED SITE PLUGINS (ALSO SEARCHABLE BY NAME OR CATEGORY)  */}
      {/* ===================================================================== */}
      {activeView === "installed" ? (
        <section className="rounded-3xl border border-line bg-white p-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
                Node Package Extension Runtime
              </p>
              <h2 className="mt-1 text-lg font-semibold text-ink">
                Installed Site Plugins ({activeCount} Active / {plugins.length} Total)
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                Filter installed Node packages by activation state, category, or name.
              </p>
            </div>

            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 rounded-full border border-line bg-canvas p-1">
              {(["all", "active", "inactive"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${
                    statusFilter === tab ? "bg-brand text-white" : "text-muted hover:text-ink"
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

          {/* Installed Plugins Search by Name or Category */}
          <form
            role="search"
            onSubmit={(e) => e.preventDefault()}
            className="mt-4 flex flex-wrap items-end gap-3"
          >
            <div className="min-w-[180px]">
              <label
                htmlFor={installedCategorySelectId}
                className="flex items-center gap-1 text-[11px] font-semibold text-muted"
              >
                <Filter size={11} />
                Category
              </label>
              <select
                id={installedCategorySelectId}
                name="installedCategory"
                value={installedCategoryFilter}
                onChange={(e) =>
                  setInstalledCategoryFilter(e.target.value as PluginCategoryFilter)
                }
                className="mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-semibold text-ink"
              >
                <option value="all">All Categories</option>
                {PLUGIN_CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-[260px] flex-1">
              <label
                htmlFor={installedSearchInputId}
                className="block text-[11px] font-semibold text-muted"
              >
                Search Installed Plugins by Name or Category
              </label>
              <div className="relative mt-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
                />
                <input
                  id={installedSearchInputId}
                  name="installedQuery"
                  type="search"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  placeholder="Filter installed plugins by name, @nextpress/package, or category..."
                  value={installedSearchQuery}
                  onChange={(e) => setInstalledSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-line bg-canvas py-2 pr-8 pl-9 text-xs text-ink placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none"
                />
                {installedSearchQuery ? (
                  <button
                    type="button"
                    onClick={() => setInstalledSearchQuery("")}
                    aria-label="Clear installed plugin search"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-muted hover:text-ink"
                  >
                    <X size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          </form>

          {/* Installed Plugins List */}
          <div className="mt-5 divide-y divide-line rounded-2xl border border-line">
            {filteredInstalledPlugins.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-ink">
                  No installed plugins match your filter.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveView("add-new")}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
                >
                  <Sparkles size={13} />
                  Search the Add New Plugin directory instead →
                </button>
              </div>
            ) : (
              filteredInstalledPlugins.map((plugin) => {
                const isEditing = editingPluginId === plugin.id;
                const cat = resolvePluginCategory(plugin.packageName, plugin.hooks);

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
                            <Plug
                              size={15}
                              className={plugin.enabled ? "text-brand" : "text-muted"}
                            />
                            {plugin.displayName}
                          </span>
                          <span className="rounded-full border border-brand/25 bg-brand-soft px-2.5 py-0.5 text-[11px] font-semibold text-brand">
                            {cat.label}
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
                              <span className="font-mono text-xs font-semibold text-ink">
                                {key}
                              </span>
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
              })
            )}
          </div>
        </section>
      ) : null}

      {/* Workspace package.json Node Dependencies Inspector */}
      <section className="rounded-3xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">
              Workspace Runtime
            </p>
            <h2 className="mt-1 text-base font-semibold text-ink">
              <code>package.json</code> Verified Host Dependencies
            </h2>
          </div>
          <span className="text-xs text-muted">
            {Object.keys(workspaceDependencies).length} packages in host workspace
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(workspaceDependencies).map(([dep, ver]) => (
            <div
              key={dep}
              className="flex items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2 text-xs"
            >
              <code className="font-mono font-semibold text-ink">{dep}</code>
              <span className="rounded bg-white px-2 py-0.5 font-mono text-[11px] text-muted">
                {ver}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
