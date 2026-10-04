import "server-only";

import { cache } from "react";
import { getCollections } from "@/server/db";
import { requireAdmin } from "@/server/dal";
import { loadCategoryRefs, toVideo } from "@/server/mappers";
import type { Video } from "@/types";

/*
 * Video okuma katmanı (MongoDB). Yayın tarihine göre en yeni önce.
 */

const NEWEST_FIRST = { publishedAt: -1, _id: -1 } as const;

/**
 * Public site: videolar. "İlgili makale" bağlantısı yalnızca makale
 * yayındaysa gösterilir (taslağa alınmış makaleye 404 bağlantısı çıkmaz).
 */
export const getVideos = cache(async (limit?: number): Promise<Video[]> => {
  const c = await getCollections();
  const [docs, refs, published] = await Promise.all([
    c.videos.find({}, { sort: NEWEST_FIRST, limit: limit ?? 0 }).toArray(),
    loadCategoryRefs(c),
    c.articles.distinct("slug", { status: "published" }),
  ]);
  const publishedSlugs = new Set(published);
  return docs.map((doc) => {
    const video = toVideo(doc, refs);
    return video.relatedArticleSlug && !publishedSlugs.has(video.relatedArticleSlug)
      ? { ...video, relatedArticleSlug: null }
      : video;
  });
});

/** Makale detayında "bu konuyu videodan izleyin" kutusu için. */
export async function getVideoForArticle(articleSlug: string): Promise<Video | null> {
  const c = await getCollections();
  const doc = await c.videos.findOne({ relatedArticleSlug: articleSlug }, { sort: NEWEST_FIRST });
  return doc ? toVideo(doc, await loadCategoryRefs(c)) : null;
}

/** Panel: tüm videolar. */
export const getVideosForAdmin = cache(async (): Promise<Video[]> => {
  await requireAdmin();
  const c = await getCollections();
  const [docs, refs] = await Promise.all([c.videos.find({}, { sort: NEWEST_FIRST }).toArray(), loadCategoryRefs(c)]);
  return docs.map((doc) => toVideo(doc, refs));
});
