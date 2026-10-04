import "server-only";

import { DOMParser } from "linkedom";
import { normalizeArticleHtml, type HtmlParser } from "./article-content";

const parser = new DOMParser() as unknown as HtmlParser;

/**
 * Sunucuda makale içeriğini temizler ve editörle uyumlu yapıya getirir
 * (kurallar: article-content.ts). Makale kaydedilirken (actions.ts) ve
 * veritabanından okunurken (queries.ts) bu fonksiyondan geçirilir.
 */
export function normalizeArticleContent(html: string): string {
  return normalizeArticleHtml(html, parser);
}
