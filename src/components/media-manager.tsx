"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import type { MediaAssetRecord, SiteRole } from "@/lib/content-types";
import { hasPermission } from "@/lib/permissions";
import { deleteMediaAction, registerMediaAction } from "@/lib/actions";

export function MediaManager({
  assets,
  userRole
}: {
  assets: MediaAssetRecord[];
  userRole: SiteRole;
}) {
  const dialogTitleId = useId();
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = hasPermission(userRole, "media:manage");

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const res = await registerMediaAction(formData);
    setIsSubmitting(false);
    if (!res.ok) {
      setError(res.error ?? "Failed to register media asset.");
      return;
    }
    e.currentTarget.reset();
    dialogRef.current?.close();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-semibold">Registered Media Assets</h2>
          <p className="mt-1 text-sm text-muted">
            {assets.length} asset(s) · Validated MIME types, size limits (max 10 MB), and required accessibility alt text.
          </p>
        </div>
        <button
          type="button"
          disabled={!canManage}
          onClick={() => {
            setError(null);
            dialogRef.current?.showModal();
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:opacity-50"
        >
          <ImagePlus size={17} aria-hidden="true" />
          Register Media Asset
        </button>
      </div>

      {assets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
          <h3 className="font-semibold">No media assets registered yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Register an image or vector graphic to use in your pages and posts.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-2xs"
            >
              <div>
                <div className="flex aspect-video items-center justify-center overflow-hidden rounded-xl border border-line bg-canvas p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt={asset.altText || asset.filename}
                    className="max-h-32 w-auto object-contain"
                  />
                </div>
                <div className="mt-4 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-ink">{asset.filename}</h3>
                    <p className="mt-0.5 font-mono text-xs text-muted">{asset.mimeType}</p>
                  </div>
                  <span className="rounded-lg bg-canvas px-2 py-0.5 text-xs text-muted">
                    {Math.max(1, Math.round(asset.sizeBytes / 1024))} KB
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink">
                  <strong className="text-muted">Alt text:</strong>{" "}
                  {asset.altText || "None provided"}
                </p>
                {asset.caption ? (
                  <p className="mt-1 text-xs text-muted">{asset.caption}</p>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-xs text-muted">
                <code className="truncate">{asset.url}</code>
                {canManage ? (
                  <form action={deleteMediaAction}>
                    <input type="hidden" name="assetId" value={asset.id} />
                    <button
                      type="submit"
                      aria-label={`Delete ${asset.filename}`}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Register Media Modal Dialog */}
      <dialog
        ref={dialogRef}
        {...({ closedby: "any" } as React.DialogHTMLAttributes<HTMLDialogElement>)}
        aria-labelledby={dialogTitleId}
        className="m-auto w-full max-w-lg rounded-3xl border border-line bg-white p-6 text-ink shadow-soft"
      >
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h3 id={dialogTitleId} className="text-lg font-semibold">
            Register Media Asset
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

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="med-filename" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Filename
              </label>
              <input
                id="med-filename"
                name="filename"
                type="text"
                required
                placeholder="hero-illustration.svg"
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
              />
            </div>
            <div>
              <label htmlFor="med-mime" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                MIME Type
              </label>
              <select
                id="med-mime"
                name="mimeType"
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
              >
                <option value="image/svg+xml">image/svg+xml</option>
                <option value="image/png">image/png</option>
                <option value="image/jpeg">image/jpeg</option>
                <option value="image/webp">image/webp</option>
                <option value="application/pdf">application/pdf</option>
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="med-url" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Asset URL / Path
              </label>
              <input
                id="med-url"
                name="url"
                type="text"
                required
                defaultValue="/nextpress-mark.svg"
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 font-mono text-sm"
              />
            </div>
            <div>
              <label htmlFor="med-size" className="block text-xs font-semibold uppercase tracking-wider text-muted">
                Size (Bytes)
              </label>
              <input
                id="med-size"
                name="sizeBytes"
                type="number"
                required
                min={1}
                max={10485760}
                defaultValue={2450}
                className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="med-alt" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Alt Text (Required for Accessibility)
            </label>
            <input
              id="med-alt"
              name="altText"
              type="text"
              required
              placeholder="Descriptive text for screen readers..."
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
            />
          </div>

          <div>
            <label htmlFor="med-caption" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Caption (Optional)
            </label>
            <input
              id="med-caption"
              name="caption"
              type="text"
              placeholder="Displayed beneath image figures..."
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-sm"
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
              {isSubmitting ? "Registering..." : "Register Asset"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
