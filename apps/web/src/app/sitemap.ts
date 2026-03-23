import type { MetadataRoute } from "next";

function getSiteUrl() {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  return envUrl && envUrl.trim() ? envUrl.trim().replace(/\/$/, "") : "http://localhost:3000";
}

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/properti`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/kpr`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/developer/daftar`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}

