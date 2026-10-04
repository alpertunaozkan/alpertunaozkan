const WORDS_PER_MINUTE = 200;

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** HTML etiketlerini kaldırıp düz metin döndürür. */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|li|h[1-6]|blockquote)>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(" ").length : 0;
}

export function estimateReadingMinutes(html: string): number {
  return Math.max(1, Math.round(countWords(html) / WORDS_PER_MINUTE));
}

/** Metni kelime sınırında keser (meta description için 155 karakter). */
export function truncate(text: string, maxLength = 155): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  const cut = normalized.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${lastSpace > maxLength * 0.75 ? cut.slice(0, lastSpace) : cut}…`;
}

/** Türkçe'ye duyarlı, büyük/küçük harf bağımsız arama normalizasyonu. */
export function normalizeForSearch(value: string): string {
  return value.toLocaleLowerCase("tr-TR").normalize("NFKD").replace(/[̀-ͯ]/g, "");
}
