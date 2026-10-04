import { slugify } from "./slugify";
import { stripHtml } from "./text";

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Makale HTML'indeki h2/h3 başlıklarına kalıcı id ekler ve içindekiler
 * listesini çıkarır.
 *
 * Not: Gelen HTML veri katmanında izinli listeyle temizlenmiş olmalıdır
 * (article-content.server.ts); bu fonksiyon temizlik yapmaz.
 */
export function prepareArticleHtml(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const usedIds = new Set<string>();

  const output = html.replace(
    /<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/gi,
    (_match, levelText: string, inner: string) => {
      const text = stripHtml(inner);
      if (!text) return "";

      const base = slugify(text) || "baslik";
      let id = base;
      let suffix = 2;
      while (usedIds.has(id)) id = `${base}-${suffix++}`;
      usedIds.add(id);

      const level = levelText === "2" ? 2 : 3;
      toc.push({ id, text, level });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    },
  );

  return { html: output, toc };
}
