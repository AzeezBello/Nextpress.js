import type { SiteRole } from "@/lib/content-types";

export type PermissionAction =
  | "site:read"
  | "site:manage"
  | "plugins:manage"
  | "theme:manage"
  | "members:manage"
  | "content:create"
  | "content:edit_own"
  | "content:edit_any"
  | "content:publish"
  | "content:delete"
  | "media:manage"
  | "taxonomy:manage";

const ROLE_PERMISSIONS: Record<SiteRole, readonly PermissionAction[]> = {
  owner: [
    "site:read",
    "site:manage",
    "plugins:manage",
    "theme:manage",
    "members:manage",
    "content:create",
    "content:edit_own",
    "content:edit_any",
    "content:publish",
    "content:delete",
    "media:manage",
    "taxonomy:manage"
  ],
  admin: [
    "site:read",
    "site:manage",
    "plugins:manage",
    "theme:manage",
    "content:create",
    "content:edit_own",
    "content:edit_any",
    "content:publish",
    "content:delete",
    "media:manage",
    "taxonomy:manage"
  ],
  developer: [
    "site:read",
    "site:manage",
    "plugins:manage",
    "theme:manage",
    "content:create",
    "content:edit_own",
    "content:edit_any",
    "content:publish",
    "content:delete",
    "media:manage",
    "taxonomy:manage"
  ],
  editor: [
    "site:read",
    "content:create",
    "content:edit_own",
    "content:edit_any",
    "content:publish",
    "content:delete",
    "media:manage",
    "taxonomy:manage"
  ],
  author: [
    "site:read",
    "content:create",
    "content:edit_own",
    "media:manage"
  ]
};

export function hasPermission(role: SiteRole | null | undefined, action: PermissionAction): boolean {
  if (!role) return false;
  const allowed = ROLE_PERMISSIONS[role];
  return Array.isArray(allowed) && allowed.includes(action);
}

export function canEditContent(
  role: SiteRole | null | undefined,
  userId: string,
  authorId: string
): boolean {
  if (!role) return false;
  if (hasPermission(role, "content:edit_any")) return true;
  if (hasPermission(role, "content:edit_own") && userId === authorId) return true;
  return false;
}

export const ROLE_DESCRIPTIONS: Record<SiteRole, { label: string; summary: string }> = {
  owner: {
    label: "Owner",
    summary: "Full control over site settings, memberships, publishing, and all content."
  },
  admin: {
    label: "Administrator",
    summary: "Manages site configuration, design tokens, media, and all content publishing."
  },
  developer: {
    label: "Developer",
    summary:
      "Installs and configures Node package plugins, Appearance theme tokens, technical SEO/schema, and content."
  },
  editor: {
    label: "Editor",
    summary: "Creates, edits, previews, publishes, and unpublishes any page or post."
  },
  author: {
    label: "Author",
    summary: "Creates and edits own drafts and media; cannot publish or modify site settings."
  }
};
