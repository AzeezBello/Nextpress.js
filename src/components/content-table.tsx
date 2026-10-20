"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  Edit3,
  ExternalLink,
  Eye,
  Plus,
  Search,
  Trash2,
  X
} from "lucide-react";
import type { ContentKind, ContentSummary, SiteRole } from "@/lib/content-types";
import { hasPermission } from "@/lib/permissions";
import { createContentAction, deleteContentAction } from "@/lib/actions";

export function ContentTable({
  kind,
  items,
  siteSlug,
  userRole
}: {
  kind: ContentKind;
  items: ContentSummary[];
  siteSlug: string;
  userRole: SiteRole;
}) {
  const captionId = useId();
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreate = hasPermission(userRole, "content:create");
  const canDelete = hasPermission(userRole, "content:delete");

  // Fallback for browsers without native <dialog closedby="any"> support
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!("closedBy" in HTMLDialogElement.prototype)) {
      const handleBackdropClick = (event: MouseEvent) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      };
      dialog.addEventListener("click", handleBackdropClick);
      return () => dialog.removeEventListener("click", handleBackdropClick);
    }
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.slug.toLowerCase().includes(q) ||
      item.authorName.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  async function handleCreateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const result = await createContentAction(formData);
    if (result?.error) {
      setFormError(result.error);
      setIsSubmitting(false);
    }
  }

  const kindLabel = kind === "page" ? "Page" : "Post";
  const kindPlural = kind === "page" ? "Pages" : "Posts";

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">All {kindPlural.toLowerCase()}</h2>
          <p className="mt-1 text-sm text-muted">
            {items.length} total · Create, edit blocks, preview privately, and publish to live routes.
          </p>
        </div>
        <button
          type="button"
          disabled={!canCreate}
          onClick={() => {
            setFormError(null);
            dialogRef.current?.showModal();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} aria-hidden="true" />
          New {kindLabel.toLowerCase()}
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm text-muted shadow-2xs">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search {kindPlural.toLowerCase()}</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${kindPlural.toLowerCase()} by title, slug, or author...`}
            className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </label>

        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-white p-1">
          {["all", "published", "draft"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === st
                  ? "bg-brand-soft text-brand"
                  : "text-muted hover:text-ink"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Semantic Table */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <h3 className="font-semibold">No matching {kindPlural.toLowerCase()} found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            Create a new {kindLabel.toLowerCase()} or clear your search filters.
          </p>
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby={captionId}
          className="np-table-wrapper rounded-2xl border border-line bg-white shadow-2xs"
        >
          <table
            className="np-table text-sm"
            style={
              {
                "--label-2": '"Route / Slug"',
                "--label-3": '"Status"',
                "--label-4": '"Updated"',
                "--label-5": '"Actions"'
              } as React.CSSProperties
            }
          >
            <caption id={captionId} className="sr-only">
              Site {kindPlural} directory and publication status
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-muted">
                <th scope="col" className="px-5 py-3.5">
                  {kindLabel}
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Route / Slug
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Updated
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredItems.map((item) => {
                const publicPath =
                  kind === "page"
                    ? `/s/${siteSlug}/${item.slug}`
                    : `/s/${siteSlug}/blog/${item.slug}`;

                return (
                  <tr key={item.id} className="transition hover:bg-canvas/50">
                    <th scope="row" className="px-5 py-4 font-semibold text-ink">
                      <Link
                        href={`/${kind}s/${item.id}`}
                        className="hover:text-brand hover:underline"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs font-normal text-muted">
                        By {item.authorName}
                        {item.excerpt ? ` · ${item.excerpt}` : ""}
                      </p>
                    </th>
                    <td data-col="2" className="px-5 py-4 font-mono text-xs text-muted">
                      {publicPath}
                    </td>
                    <td data-col="3" className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          item.status === "published"
                            ? "bg-brand-soft text-brand"
                            : "bg-[#F8EBD9] text-[#8A5A20]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td data-col="4" className="px-5 py-4 text-xs text-muted">
                      {new Date(item.updatedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td data-col="5" className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          href={`/${kind}s/${item.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand hover:text-brand"
                        >
                          <Edit3 size={13} aria-hidden="true" />
                          Edit
                        </Link>
                        <Link
                          href={`/preview/${item.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand hover:text-brand"
                        >
                          <Eye size={13} aria-hidden="true" />
                          Preview
                        </Link>
                        {item.status === "published" ? (
                          <Link
                            href={publicPath}
                            target="_blank"
                            className="inline-flex items-center gap-1 rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-white"
                          >
                            <ExternalLink size={13} aria-hidden="true" />
                            Live
                          </Link>
                        ) : null}
                        {canDelete ? (
                          <form action={deleteContentAction}>
                            <input type="hidden" name="contentId" value={item.id} />
                            <input type="hidden" name="kind" value={kind} />
                            <button
                              type="submit"
                              aria-label={`Delete ${item.title}`}
                              className="inline-flex items-center rounded-lg border border-line p-1.5 text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={14} aria-hidden="true" />
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Content Modal Dialog using native <dialog closedby="any"> */}
      <dialog
        ref={dialogRef}
        {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby={dialogTitleId}
        className="m-auto w-full max-w-lg rounded-3xl border border-line bg-white p-6 text-ink shadow-soft"
      >
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h3 id={dialogTitleId} className="text-lg font-semibold">
            Create new {kindLabel.toLowerCase()}
          </h3>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close modal"
            className="rounded-xl p-1.5 text-muted hover:bg-canvas hover:text-ink"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
          <input type="hidden" name="kind" value={kind} />

          {formError ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-800">
              {formError}
            </div>
          ) : null}

          <div>
            <label htmlFor="new-title" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              {kindLabel} Title
            </label>
            <input
              id="new-title"
              name="title"
              type="text"
              required
              placeholder={kind === "page" ? "e.g. Services & Pricing" : "e.g. How We Built Our Design System"}
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="new-slug" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Custom URL Slug (optional)
            </label>
            <input
              id="new-slug"
              name="slug"
              type="text"
              placeholder="auto-generated-from-title"
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-sm text-ink focus:border-brand"
            />
          </div>

          <div>
            <label htmlFor="new-excerpt" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Short Excerpt / Summary
            </label>
            <textarea
              id="new-excerpt"
              name="excerpt"
              rows={2}
              placeholder="Brief overview for listings and default SEO description..."
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2 text-sm text-ink focus:border-brand"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-full border border-line bg-white px-5 py-2.5 text-xs font-semibold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-brand px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-ink disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : `Create ${kindLabel} & Open Editor`}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
