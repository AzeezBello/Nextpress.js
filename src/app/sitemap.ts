import type { MetadataRoute } from "next";
import { listAllPublicSites, listPublishedContentForSite } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sites = listAllPublicSites();

  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1
    }
  ];

  for (const site of sites) {
    entries.push({
      url: `${baseUrl}/s/${site.slug}`,
      lastModified: new Date(site.updatedAt),
      changeFrequency: "daily",
      priority: 0.9
    });

    const pages = listPublishedContentForSite(site.id, "page");
    for (const p of pages) {
      if (p.slug === "home") continue;
      entries.push({
        url: `${baseUrl}/s/${site.slug}/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8
      });
    }

    const posts = listPublishedContentForSite(site.id, "post");
    for (const post of posts) {
      entries.push({
        url: `${baseUrl}/s/${site.slug}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: "weekly",
        priority: 0.7
      });
    }
  }

  return entries;
}
