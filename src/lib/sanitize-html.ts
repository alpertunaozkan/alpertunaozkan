import { normalizeArticleHtml } from "./article-content";

/**
 * Tarayıcıda makale içeriğini temizler (panel önizlemesi). Sunucudaki veri
 * katmanıyla aynı kuralları uygular (article-content.ts); böylece önizleme
 * sitedeki görünümle birebir aynıdır.
 *
 * Güvenlik sınırı burası değildir: içerik kaydedilmeden önce sunucuda aynı
 * izinli listeyle yeniden temizlenir (article-content.server.ts).
 */
export function sanitizeArticleHtml(html: string): string {
  if (typeof window === "undefined") return "";
  return normalizeArticleHtml(html, new DOMParser());
}
