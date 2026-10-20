import type { MetadataRoute } from "next";
import { listAllPublicSites } from "@/lib/db";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sites = listAllPublicSites();

  const allowPaths = new Set<string>(["/", "/s/"]);
  const disallowPaths = new Set<string>([
    "/dashboard",
    "/pages",
    "/posts",
    "/media",
    "/appearance",
    "/plugins",
    "/seo",
    "/settings",
    "/preview/"
  ]);

  for (const site of sites) {
    const custom = site.seoDefaults.customRobotsTxt;
    if (!custom) continue;
    for (const line of custom.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith("disallow:")) {
        const val = trimmed.slice(9).trim();
        if (val) disallowPaths.add(val);
      } else if (trimmed.toLowerCase().startsWith("allow:")) {
        const val = trimmed.slice(6).trim();
        if (val) allowPaths.add(val);
      }
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: Array.from(allowPaths),
        disallow: Array.from(disallowPaths)
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
