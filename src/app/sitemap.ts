import type { MetadataRoute } from "next";
import { LOCATION_PAGE } from "@/constants/site";
import { getPublishedArticles } from "@/features/articles/queries";
import { absoluteUrl } from "@/lib/seo";

/** Eski sitedeki sayfa listesi ve öncelikleri korunmuştur (panel hariç). */
const STATIC_PAGES: Array<{ path: string; priority: number }> = [
  { path: "/", priority: 1 },
  { path: LOCATION_PAGE.href, priority: 0.9 },
  { path: "/makalelerim", priority: 0.8 },
  { path: "/faaliyet-alanlarim", priority: 0.8 },
  { path: "/hakkimda", priority: 0.8 },
  { path: "/videolarim", priority: 0.8 },
  { path: "/iletisim", priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles();
  const lastContentUpdate = articles[0]?.updatedAt ?? new Date().toISOString();

  return [
    ...STATIC_PAGES.map(({ path, priority }) => ({
      url: absoluteUrl(path),
      lastModified: lastContentUpdate,
      changeFrequency: "weekly" as const,
      priority,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/makalelerim/${article.slug}`),
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
