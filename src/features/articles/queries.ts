import "server-only";

import { cache } from "react";
import { normalizeArticleContent } from "@/lib/article-content.server";
import { getCollections } from "@/server/db";
import { requireAdmin } from "@/server/dal";
import type { ArticleDocument } from "@/server/documents";
import { loadCategoryRefs, toArticle, type CategoryRefs } from "@/server/mappers";
import type { Article, ArticleSummary } from "@/types";

/*
 * Makale okuma katmanı (MongoDB). Herkese açık sayfalar derlemede ve panelde
 * bir değişiklik yapıldığında yeniden üretilir (bkz. revalidatePublicSite);
 * her ziyaret veritabanına gitmez.
 */

const PUBLISHED = { status: "published" } as const;
const NEWEST_FIRST = { publishedAt: -1, _id: -1 } as const;

/** Liste yanıtlarında gövde (content) taşınmaz. */
function toSummary(doc: ArticleDocument, refs: CategoryRefs): ArticleSummary {
  const summary: Partial<Article> = toArticle({ ...doc, content: "" }, refs);
  delete summary.content;
  return summary as ArticleSummary;
}

/**
 * İçerik veritabanından nasıl gelirse gelsin (eski editörün çıktısı, düz
 * metin, izinsiz etiketler) site ve panel için aynı kurallarla temizlenir.
 */
function withCleanContent(doc: ArticleDocument): ArticleDocument {
  return { ...doc, content: normalizeArticleContent(doc.content) };
}

/** Public site: yayındaki makaleler (en yeni önce), içerik gövdesi olmadan. */
export const getPublishedArticles = cache(async (limit?: number): Promise<ArticleSummary[]> => {
  const c = await getCollections();
  const [docs, refs] = await Promise.all([
    c.articles.find(PUBLISHED, { projection: { content: 0 }, sort: NEWEST_FIRST, limit: limit ?? 0 }).toArray(),
    loadCategoryRefs(c),
  ]);
  return docs.map((doc) => toSummary(doc, refs));
});

/** Public site: slug ile yayındaki makale. Taslaklar ve olmayan adresler null döner. */
export const getPublishedArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const c = await getCollections();
  const doc = await c.articles.findOne({ ...PUBLISHED, slug });
  return doc ? toArticle(withCleanContent(doc), await loadCategoryRefs(c)) : null;
});

/** Adresi değiştirilmiş yayındaki makalenin güncel slug'ı (eski bağlantıların 301 yönlendirmesi için). */
export const findRenamedArticleSlug = cache(async (previousSlug: string): Promise<string | null> => {
  const c = await getCollections();
  const doc = await c.articles.findOne({ ...PUBLISHED, previousSlugs: previousSlug }, { projection: { slug: 1 } });
  return doc?.slug ?? null;
});

export async function getPublishedArticleSlugs(): Promise<string[]> {
  const c = await getCollections();
  const docs = await c.articles.find(PUBLISHED, { projection: { slug: 1 }, sort: NEWEST_FIRST }).toArray();
  return docs.map((doc) => doc.slug);
}

/** Aynı kategorideki diğer makaleler; yeterli değilse en yenilerle tamamlanır. */
export async function getRelatedArticles(article: Article, limit = 3): Promise<ArticleSummary[]> {
  const others = (await getPublishedArticles()).filter((item) => item.id !== article.id);
  const sameCategory = others.filter((item) => item.category?.id === article.category?.id);
  const rest = others.filter((item) => item.category?.id !== article.category?.id);
  return [...sameCategory, ...rest].slice(0, limit);
}

/** Panel: taslaklar dahil tüm makaleler (son güncellenen önce). */
export const getArticlesForAdmin = cache(async (): Promise<Article[]> => {
  await requireAdmin();
  const c = await getCollections();
  const [docs, refs] = await Promise.all([
    c.articles.find({}, { sort: { updatedAt: -1, _id: -1 } }).toArray(),
    loadCategoryRefs(c),
  ]);
  return docs.map((doc) => toArticle(withCleanContent(doc), refs));
});
