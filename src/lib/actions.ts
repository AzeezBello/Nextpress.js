"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  authenticateUser,
  createContentItem,
  createSessionForUser,
  createTaxonomy,
  deleteContentItem,
  deleteMediaAsset,
  deleteSessionByToken,
  registerMediaAsset,
  restoreRevision,
  setContentPublicationStatus,
  switchSessionActiveSite,
  updateContentItem,
  updateSiteSettings
} from "@/lib/db";
import { getCurrentSession, requireSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import type { ContentKind, SeoMetadata, ThemeSettings } from "@/lib/content-types";

export async function signInAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter both your email address and password." };
  }

  const user = authenticateUser(email, password);
  if (!user) {
    return { error: "Invalid email or password. Try one of the demo accounts below." };
  }

  const session = createSessionForUser(user.id);
  if (!session) {
    return { error: "This user account has no active site memberships." };
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  redirect("/dashboard");
}

export async function quickDemoSignInAction(formData: FormData): Promise<void> {
  const userId = String(formData.get("userId") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "/dashboard").trim();
  if (!userId) return;

  const current = await getCurrentSession();
  const preferredSiteId = current?.activeSite.id;
  if (current) {
    deleteSessionByToken(current.token);
  }

  const session = createSessionForUser(userId, preferredSiteId);
  if (!session) return;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });

  revalidatePath("/", "layout");
  redirect(returnTo.startsWith("/") ? returnTo : "/dashboard");
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  deleteSessionByToken(token);
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

export async function switchSiteAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const siteId = String(formData.get("siteId") ?? "").trim();
  if (siteId) {
    switchSessionActiveSite(session.token, siteId);
    revalidatePath("/", "layout");
  }
}

export async function createContentAction(formData: FormData): Promise<{ error?: string }> {
  const session = await requireSession();
  const kind = (formData.get("kind") === "post" ? "post" : "page") as ContentKind;
  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();

  const res = createContentItem({
    siteId: session.activeSite.id,
    actorId: session.user.id,
    kind,
    title,
    slug: slug || undefined,
    excerpt
  });

  if (!res.ok) {
    return { error: res.error };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${kind}s`);
  redirect(`/${kind}s/${res.item.id}`);
}

export async function saveContentDocumentAction(payload: {
  contentId: string;
  title: string;
  slug: string;
  excerpt: string;
  document: unknown;
  seo: SeoMetadata;
  taxonomyIds?: string[];
  revisionNote?: string;
}): Promise<{ ok: boolean; error?: string; updatedAt?: string }> {
  const session = await requireSession();
  const res = updateContentItem({
    siteId: session.activeSite.id,
    contentId: payload.contentId,
    actorId: session.user.id,
    title: payload.title,
    slug: payload.slug,
    excerpt: payload.excerpt,
    document: payload.document,
    seo: payload.seo,
    taxonomyIds: payload.taxonomyIds,
    revisionNote: payload.revisionNote
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${res.item.kind}s`);
  revalidatePath(`/${res.item.kind}s/${res.item.id}`);
  revalidatePath(`/preview/${res.item.id}`);
  revalidatePath(`/s/${session.activeSite.slug}`, "layout");
  return { ok: true, updatedAt: res.item.updatedAt };
}

export async function togglePublishContentAction(payload: {
  contentId: string;
  targetStatus: "published" | "draft";
}): Promise<{ ok: boolean; error?: string; status?: string }> {
  const session = await requireSession();
  const res = setContentPublicationStatus({
    siteId: session.activeSite.id,
    contentId: payload.contentId,
    actorId: session.user.id,
    status: payload.targetStatus
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${res.item.kind}s`);
  revalidatePath(`/${res.item.kind}s/${res.item.id}`);
  revalidatePath(`/preview/${res.item.id}`);
  revalidatePath(`/s/${session.activeSite.slug}`, "layout");
  revalidatePath(`/s/${session.activeSite.slug}/${res.item.slug}`);
  revalidatePath(`/s/${session.activeSite.slug}/blog/${res.item.slug}`);
  return { ok: true, status: res.item.status };
}

export async function deleteContentAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const contentId = String(formData.get("contentId") ?? "").trim();
  const kind = String(formData.get("kind") ?? "page").trim();
  if (!contentId) return;

  deleteContentItem({
    siteId: session.activeSite.id,
    contentId,
    actorId: session.user.id
  });

  revalidatePath("/dashboard");
  revalidatePath(`/${kind}s`);
  revalidatePath(`/s/${session.activeSite.slug}`, "layout");
}

export async function restoreRevisionAction(payload: {
  contentId: string;
  revisionId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const res = restoreRevision({
    siteId: session.activeSite.id,
    contentId: payload.contentId,
    revisionId: payload.revisionId,
    actorId: session.user.id
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath(`/${res.item.kind}s/${res.item.id}`);
  revalidatePath(`/preview/${res.item.id}`);
  revalidatePath(`/s/${session.activeSite.slug}`, "layout");
  return { ok: true };
}

export async function registerMediaAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const filename = String(formData.get("filename") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const mimeType = String(formData.get("mimeType") ?? "image/svg+xml").trim();
  const sizeBytes = Number(formData.get("sizeBytes") ?? 2048);
  const altText = String(formData.get("altText") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  const res = registerMediaAsset({
    siteId: session.activeSite.id,
    actorId: session.user.id,
    filename,
    url,
    mimeType,
    sizeBytes,
    altText,
    caption
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/media");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const assetId = String(formData.get("assetId") ?? "").trim();
  if (!assetId) return;
  deleteMediaAsset({
    siteId: session.activeSite.id,
    assetId,
    actorId: session.user.id
  });
  revalidatePath("/media");
  revalidatePath("/dashboard");
}

export async function createTaxonomyAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  const type = formData.get("type") === "tag" ? "tag" : "category";
  const description = String(formData.get("description") ?? "").trim();

  const res = createTaxonomy({
    siteId: session.activeSite.id,
    actorId: session.user.id,
    name,
    type,
    description
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/posts");
  revalidatePath("/settings");
  return { ok: true };
}

export async function saveSiteSettingsAction(payload: {
  name: string;
  tagline: string;
  description: string;
  domain: string;
  themeSettings: ThemeSettings;
  seoDefaults: SeoMetadata;
}): Promise<{ ok: boolean; error?: string }> {
  const session = await requireSession();
  const res = updateSiteSettings({
    siteId: session.activeSite.id,
    actorId: session.user.id,
    ...payload
  });

  if (!res.ok) {
    return { ok: false, error: res.error };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  revalidatePath(`/s/${session.activeSite.slug}`, "layout");
  return { ok: true };
}
